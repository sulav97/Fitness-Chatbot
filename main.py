# -- Full RAG + Gemini Tool Binding (FastAPI + ChromaDB) --

import os
from dotenv import load_dotenv
from typing import Annotated, TypedDict, Sequence
from operator import add as add_messages
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.responses import JSONResponse

from langchain_core.messages import HumanMessage, BaseMessage, SystemMessage, ToolMessage
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_core.tools import tool

load_dotenv()

# --- Load Gemini LLM ---
llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    temperature=0.7,
    google_api_key=os.getenv("GEMINI_API_KEY")
)

# --- Embedding ---
embedding_model = GoogleGenerativeAIEmbeddings(
    model="models/embedding-001",
    google_api_key=os.getenv("GEMINI_API_KEY")
)

# --- Load PDF ---
pdf_path = "fitnessdataset.pdf"
if not os.path.exists(pdf_path):
    raise FileNotFoundError("PDF not found!")

loader = PyPDFLoader(pdf_path)
pages = loader.load()
splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
docs = splitter.split_documents(pages)

# --- Vector Store ---
persist_directory = "chroma.db"
vectorstore = Chroma.from_documents(
    documents=docs,
    embedding=embedding_model,
    persist_directory=persist_directory,
    collection_name="fitness_docs"
)
retriever = vectorstore.as_retriever(search_kwargs={"k": 5})

# --- Tool Function ---
@tool
def retriever_tool(query: str) -> str:
    """Search fitness documents and return the most relevant information."""
    results = retriever.invoke(query)
    if not results:
        return "Sorry, no relevant information was found."
    return "\n\n".join([f"{i+1}. {doc.page_content}" for i, doc in enumerate(results)])

tools = [retriever_tool]
llm = llm.bind_tools(tools)
tools_dict = {tool_.name: tool_ for tool_ in tools}

# --- Agent State ---
class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]

def should_continue(state: AgentState):
    return hasattr(state["messages"][-1], "tool_calls") and len(state["messages"][-1].tool_calls) > 0

system_prompt = """
You are FitBuddy, a professional fitness assistant.
You ONLY answer fitness-related questions using documents and fitness knowledge.
If the question is outside fitness, respond with:
"I'm sorry, I can only help with fitness-related topics."
"""

# --- LLM Agent Node ---
def call_llm(state: AgentState) -> AgentState:
    messages = [SystemMessage(content=system_prompt)] + list(state["messages"])
    response = llm.invoke(messages)
    return {"messages": [response]}

# --- Tool Execution Node ---
def take_action(state: AgentState) -> AgentState:
    tool_calls = state["messages"][-1].tool_calls
    messages = list(state["messages"])

    for t in tool_calls:
        print(f"Calling Tool: {t['name']} with query: {t['args'].get('query')}")
        result = tools_dict[t["name"]].invoke(t["args"].get("query", ""))
        messages.append(ToolMessage(tool_call_id=t["id"], name=t["name"], content=result))
    return {"messages": messages}

# --- Build LangGraph ---
graph = StateGraph(AgentState)
graph.add_node("llm", call_llm)
graph.add_node("retriever", take_action)
graph.set_entry_point("llm")
graph.add_edge("retriever", "llm")
graph.add_conditional_edges("llm", should_continue, {True: "retriever", False: END})
rag_agent = graph.compile()

# --- FastAPI App ---
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    user_msg = request.message
    print(f"[User]: {user_msg}")
    result = rag_agent.invoke({"messages": [HumanMessage(content=user_msg)]})
    reply = result['messages'][-1].content
    print(f"[Agent]: {reply}")
    return ChatResponse(reply=reply)

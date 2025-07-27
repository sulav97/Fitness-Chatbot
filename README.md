# FitBuddy - AI Fitness Assistant

A conversational AI fitness assistant powered by Gemini and RAG (Retrieval-Augmented Generation) technology.

## Features

- **AI-Powered Chat**: Interactive fitness assistant using Google's Gemini model
- **RAG System**: Retrieves relevant fitness information from PDF documents
- **Modern UI**: React frontend with Tailwind CSS
- **FastAPI Backend**: RESTful API with CORS support

## Tech Stack

- **Backend**: Python, FastAPI, LangChain, ChromaDB
- **Frontend**: React, Vite, Tailwind CSS
- **AI**: Google Gemini API
- **Vector Database**: ChromaDB

## Quick Start

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   cd frontend && npm install
   ```

2. **Set Environment Variables**
   ```bash
   GEMINI_API_KEY=your_gemini_api_key
   ```

3. **Start Backend**
   ```bash
   python main.py
   ```

4. **Start Frontend**
   ```bash
   cd frontend && npm run dev
   ```

5. **Access Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000

## Usage

Ask FitBuddy any fitness-related questions and get personalized responses based on the fitness dataset. 
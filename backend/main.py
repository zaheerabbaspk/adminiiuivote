from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import psycopg2
from psycopg2.extras import RealDictCursor
from passlib.context import CryptContext
from typing import List, Optional
import os

app = FastAPI(title="Voting App API")

# Define CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Password Hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Database Connection Helper
def get_db_connection():
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "localhost"),
            database=os.getenv("DB_NAME", "iiuivote"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "admin"),
            cursor_factory=RealDictCursor
        )
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None

# Pydantic Models
class UserRegister(BaseModel):
    username: str
    password: str
    email: str

class UserLogin(BaseModel):
    username: str
    password: str

class VoteRequest(BaseModel):
    user_id: int
    candidate_id: int

class CandidateCreate(BaseModel):
    name: str
    position: str

# Initialize Database Schema
@app.on_event("startup")
def startup_db():
    conn = get_db_connection()
    if conn:
        cur = conn.cursor()
        # Create Users table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                has_voted BOOLEAN DEFAULT FALSE
            );
        """)
        # Create Candidates table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS candidates (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                position TEXT NOT NULL,
                vote_count INTEGER DEFAULT 0
            );
        """)
        # Create Votes table for record
        cur.execute("""
            CREATE TABLE IF NOT EXISTS votes (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                candidate_id INTEGER REFERENCES candidates(id),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # Insert initial candidates if table is empty
        cur.execute("SELECT COUNT(*) FROM candidates")
        if cur.fetchone()['count'] == 0:
            initial_candidates = [
                ("Candidate A", "President"),
                ("Candidate B", "Vice President"),
                ("Candidate C", "General Secretary")
            ]
            for name, pos in initial_candidates:
                cur.execute("INSERT INTO candidates (name, position) VALUES (%s, %s)", (name, pos))
                
        conn.commit()
        cur.close()
        conn.close()

# Endpoints
@app.post("/register")
def register(user: UserRegister):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    cur = conn.cursor()
    hashed_password = pwd_context.hash(user.password)
    try:
        cur.execute(
            "INSERT INTO users (username, email, password) VALUES (%s, %s, %s) RETURNING id",
            (user.username, user.email, hashed_password)
        )
        new_user = cur.fetchone()
        conn.commit()
        return {"message": "User registered successfully", "user_id": new_user['id']}
    except psycopg2.IntegrityError:
        conn.rollback()
        raise HTTPException(status_code=400, detail="Username or email already exists")
    finally:
        cur.close()
        conn.close()

@app.post("/login")
def login(user: UserLogin):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE username = %s", (user.username,))
    db_user = cur.fetchone()
    cur.close()
    conn.close()
    
    if not db_user or not pwd_context.verify(user.password, db_user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {"message": "Login successful", "user_id": db_user['id'], "has_voted": db_user['has_voted']}

@app.get("/candidates")
def get_candidates():
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    cur = conn.cursor()
    cur.execute("SELECT * FROM candidates")
    candidates = cur.fetchall()
    cur.close()
    conn.close()
    return candidates

@app.post("/candidates")
def create_candidate(candidate: CandidateCreate):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO candidates (name, position) VALUES (%s, %s) RETURNING id",
            (candidate.name, candidate.position)
        )
        new_candidate = cur.fetchone()
        conn.commit()
        return {"message": "Candidate added successfully", "candidate_id": new_candidate['id']}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@app.post("/vote")
def cast_vote(vote: VoteRequest):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    cur = conn.cursor()
    
    # Check if user has already voted
    cur.execute("SELECT has_voted FROM users WHERE id = %s", (vote.user_id,))
    user = cur.fetchone()
    if not user or user['has_voted']:
        cur.close()
        conn.close()
        raise HTTPException(status_code=400, detail="User has already voted or doesn't exist")
    
    try:
        # Update user status
        cur.execute("UPDATE users SET has_voted = TRUE WHERE id = %s", (vote.user_id,))
        # Record the vote
        cur.execute("INSERT INTO votes (user_id, candidate_id) VALUES (%s, %s)", (vote.user_id, vote.candidate_id))
        # Update candidate count
        cur.execute("UPDATE candidates SET vote_count = vote_count + 1 WHERE id = %s", (vote.candidate_id,))
        
        conn.commit()
        return {"message": "Vote cast successfully"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@app.get("/results")
def get_results():
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    cur = conn.cursor()
    cur.execute("SELECT name, vote_count FROM candidates ORDER BY vote_count DESC")
    results = cur.fetchall()
    cur.close()
    conn.close()
    return results

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

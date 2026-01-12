from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import psycopg2
from psycopg2.extras import RealDictCursor
from passlib.context import CryptContext
from typing import List, Optional
import os
print("-" * 50)
print(f"STAGING SERVER STARTING FROM: {os.path.abspath(__file__)}")
print("-" * 50)

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
            host="127.0.0.1",
            database="postgres",
            user="postgres",
            password="blove1234@",
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
    party: str
    electionId: str
    imageUrl: Optional[str] = None

class ElectionCreate(BaseModel):
    name: str
    description: Optional[str] = None
    startDate: str
    endDate: str
    status: str

class VoterCreate(BaseModel):
    name: str
    email: str
    electionId: str

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
                party TEXT,
                election_id TEXT,
                image_url TEXT,
                vote_count INTEGER DEFAULT 0
            );
        """)
        # Specific check to add image_url to existing tables if missing
        cur.execute("ALTER TABLE candidates ADD COLUMN IF NOT EXISTS image_url TEXT;")
        # Create Elections table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS elections (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                start_date TEXT,
                end_date TEXT,
                status TEXT DEFAULT 'Draft',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        # Create Voters table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS voters (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                has_voted BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                election_id TEXT
            );
        """)
        # Create Votes table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS votes (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                candidate_id INTEGER REFERENCES candidates(id),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
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
    
    print(f"Total candidates found: {len(candidates)}")
    results = []
    for c in candidates:
        has_img = bool(c.get("image_url"))
        print(f"Candidate: {c['name']} | Has Image: {has_img}")
        
        results.append({
            "id": str(c["id"]),
            "name": c["name"],
            "position": c["position"],
            "party": c["party"] or "",
            "electionId": str(c["election_id"]) if c["election_id"] else "",
            "imageUrl": c["image_url"] or "",
            "votes": c["vote_count"] or 0
        })
    return results

@app.post("/candidates")
def create_candidate(candidate: CandidateCreate):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    cur = conn.cursor()
    print(f"Adding candidate: {candidate.name}")
    print(f"Image received: {'Yes' if candidate.imageUrl else 'No'}")
    if candidate.imageUrl:
        print(f"Image data starts with: {candidate.imageUrl[:50]}...")
    
    try:
        cur.execute(
            "INSERT INTO candidates (name, position, party, election_id, image_url) VALUES (%s, %s, %s, %s, %s) RETURNING id",
            (candidate.name, candidate.position, candidate.party, candidate.electionId, candidate.imageUrl)
        )
        new_candidate = cur.fetchone()
        conn.commit()
        print(f"Candidate added with ID: {new_candidate['id']}")
        return {"message": "Candidate added successfully", "candidate_id": new_candidate['id']}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@app.delete("/candidates/{candidate_id}")
def delete_candidate(candidate_id: int):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM candidates WHERE id = %s", (candidate_id,))
        conn.commit()
        return {"message": "Candidate deleted"}
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


class ElectionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    status: Optional[str] = None

# --- Election Endpoints ---
@app.get("/elections")
def get_elections():
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    cur = conn.cursor()
    cur.execute("SELECT * FROM elections ORDER BY created_at DESC")
    elections = cur.fetchall()
    cur.close()
    conn.close()
    
    return [
        {
            "id": str(e["id"]),
            "name": e["name"],
            "description": e["description"],
            "startDate": e["start_date"],
            "endDate": e["end_date"],
            "status": e["status"],
            "createdAt": str(e["created_at"])
        }
        for e in elections
    ]

@app.post("/elections")
def create_election(election: ElectionCreate):
    print(f"Received election data: {election}")
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO elections (name, description, start_date, end_date, status) VALUES (%s, %s, %s, %s, %s) RETURNING id",
            (election.name, election.description, election.startDate, election.endDate, election.status)
        )
        new_id = cur.fetchone()['id']
        conn.commit()
        print(f"Election created with ID: {new_id}")
        return {"message": "Election created", "id": new_id}
    except Exception as e:
        print(f"Error creating election: {e}")
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@app.put("/elections/{election_id}")
def update_election(election_id: int, election: ElectionUpdate):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    cur = conn.cursor()
    try:
        # Build update query dynamically based on provided fields
        update_fields = []
        params = []
        
        if election.name is not None:
            update_fields.append("name = %s")
            params.append(election.name)
        if election.description is not None:
            update_fields.append("description = %s")
            params.append(election.description)
        if election.startDate is not None:
            update_fields.append("start_date = %s")
            params.append(election.startDate)
        if election.endDate is not None:
            update_fields.append("end_date = %s")
            params.append(election.endDate)
        if election.status is not None:
            update_fields.append("status = %s")
            params.append(election.status)
            
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")
            
        query = f"UPDATE elections SET {', '.join(update_fields)} WHERE id = %s"
        params.append(election_id)
        
        cur.execute(query, tuple(params))
        conn.commit()
        
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Election not found")
            
        return {"message": "Election updated successfully"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

# --- Voter Endpoints ---
@app.get("/voters")
def get_voters():
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    cur = conn.cursor()
    cur.execute("SELECT * FROM voters")
    voters = cur.fetchall()
    cur.close()
    conn.close()
    
    return [
        {
            "id": v["id"],
            "name": v["name"],
            "email": v["email"],
            "hasVoted": v["has_voted"],
            "isActive": v["is_active"],
            "electionId": str(v["election_id"]) if v["election_id"] else ""
        } for v in voters
    ]

@app.post("/voters")
def create_voter(voter: VoterCreate):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO voters (name, email, election_id) VALUES (%s, %s, %s) RETURNING id",
            (voter.name, voter.email, voter.electionId)
        )
        new_id = cur.fetchone()['id']
        conn.commit()
        return {"message": "Voter created", "id": new_id}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

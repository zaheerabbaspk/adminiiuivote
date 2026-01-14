# Testing Guide - Backend API Integration

## Prerequisites
Ensure your backend server is running at `http://192.168.1.23:8000`

## Test Scenario 1: Create Election with Positions

### Steps:
1. Navigate to **Elections** → **Create Election** (or click the + button)
2. Fill in election details:
   - **Name**: "Student Council 2026"
   - **Description**: "Annual student elections"
   - **Start Date**: Select a future date
   - **End Date**: Select a date after start date
   - **Status**: "Draft"

3. Add positions:
   - Type "President" and click "Add" (or press Enter)
   - Type "Vice President" and click "Add"
   - Type "Secretary" and click "Add"
   - Type "Treasurer" and click "Add"

4. Click "Launch Cycle" to create the election

### Expected Backend Request:
```json
POST http://192.168.1.23:8000/elections
{
  "name": "Student Council 2026",
  "description": "Annual student elections",
  "startDate": "2026-01-20T10:00:00",
  "endDate": "2026-01-30T18:00:00",
  "status": "draft",
  "positions": ["President", "Vice President", "Secretary", "Treasurer"]
}
```

### Expected Response:
```json
{
  "id": 5,
  "name": "Student Council 2026",
  "description": "Annual student elections",
  "startDate": "2026-01-20T10:00:00",
  "endDate": "2026-01-30T18:00:00",
  "status": "draft",
  "positions": ["President", "Vice President", "Secretary", "Treasurer"],
  "createdAt": "2026-01-14T18:05:00"
}
```

## Test Scenario 2: Create Candidate with Position Selection

### Steps:
1. Navigate to **Candidates** → Click "Add Candidate" button
2. Upload a candidate image (optional)
3. Enter **Full Name**: "Ali Khan"
4. Select **Assigned Election**: "Student Council 2026"
   - ⚠️ The position dropdown should now populate with positions from this election
5. Select **Position**: "President"
6. Enter **Party**: "Student Unity Party"
7. Click "Save Candidate Profile"

### Expected Backend Request:
```json
POST http://192.168.1.23:8000/candidates
{
  "name": "Ali Khan",
  "position": "President",
  "party": "Student Unity Party",
  "electionId": "5",
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA..."
}
```

### Expected Response (Success):
```json
{
  "id": 15,
  "name": "Ali Khan",
  "position": "President",
  "party": "Student Unity Party",
  "electionId": "5",
  "imageUrl": "http://192.168.1.23:8000/uploads/cand_xyz.jpg",
  "image": "http://192.168.1.23:8000/uploads/cand_xyz.jpg",
  "voteCount": 0
}
```

### Expected Response (Invalid Position):
```json
{
  "detail": "Position 'Manager' is not available in this election. Available positions: President, Vice President, Secretary, Treasurer"
}
```

## Test Scenario 3: Get Election Positions

### What Happens:
When you select an election in the candidate form, the frontend automatically calls:

```
GET http://192.168.1.23:8000/elections/5/positions
```

### Expected Response:
```json
{
  "electionId": 5,
  "positions": ["President", "Vice President", "Secretary", "Treasurer"]
}
```

### What You Should See:
- Position dropdown becomes enabled
- Dropdown is populated with the available positions
- If no positions exist, you'll see a warning message

## Test Scenario 4: Edge Cases

### A. Election Without Positions
1. Create an election without adding any positions
2. Try to create a candidate for this election
3. You should see a warning: "No positions available for this election. Please add positions in the election settings."
4. Position dropdown should be disabled

### B. No Elections Exist
1. Try to add a candidate when no elections exist
2. You should see: "You must create an election first."

### C. Position Removal
1. While creating an election, add multiple positions
2. Hover over a position card
3. Click the X button to remove it
4. Position should be removed from the list

### D. Duplicate Position Prevention
1. Add "President" as a position
2. Try to add "President" again
3. Nothing should happen (duplicates are prevented)

## Browser Console Checks

### When Creating Election:
```
Submitting election form: {name: "...", positions: [...]}
Election added successfully, navigating...
```

### When Selecting Election (in Candidate Form):
```
Look for network request to: /elections/{id}/positions
```

### When Creating Candidate:
```
Form Submit - Data Lengths: {name: X, imageUrl: Y}
```

## Troubleshooting

### Position Dropdown Not Populating
- Check browser console for errors
- Verify the election has positions (check the election in backend)
- Ensure `GET /elections/{id}/positions` API is working

### Candidate Creation Fails
- Check if position exists in the selected election
- Verify backend validation is working
- Check console for error messages

### UI Not Updating
- Try refreshing the page
- Check if backend is returning updated data
- Verify the service is calling `loadInitialData()` after operations

## Success Indicators

✅ Elections can be created with multiple positions
✅ Position cards display correctly with remove buttons
✅ Positions are sent to backend in the correct format
✅ Candidate form shows election dropdown first
✅ Position dropdown populates based on selected election
✅ Position dropdown is disabled when appropriate
✅ Warning messages display correctly
✅ Backend validates positions correctly
✅ Images are converted to base64 automatically
✅ All CRUD operations work as expected

## Notes
- All changes are backward compatible
- Elections without positions will work (positions field is optional)
- The UI gracefully handles missing or empty positions
- Error handling is in place for all API calls

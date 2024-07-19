export const updateScore = async (lobbyId, userId, increment) => {
    try {
      console.log(`Sending request to update score: lobbyId=${lobbyId}, userId=${userId}, increment=${increment}`);
      console.log(`Type of increment: ${typeof increment}`);
      const response = await fetch('http://localhost:4000/updateScore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ lobbyId, userId, increment })
      });
  
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update score');
      }
  
      console.log('Score updated successfully:', data);
      return data;
    } catch (error) {
      console.error('Error updating score:', error);
      throw error;
    }
  };
  
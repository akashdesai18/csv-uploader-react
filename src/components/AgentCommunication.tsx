import { Paper, Typography, Box } from '@mui/material';

interface AgentCommunicationProps {
  messages: string[];
}

const AgentCommunication = ({ messages }: AgentCommunicationProps) => {
  return (
    <Paper 
      sx={{ 
        p: 2,
        height: '100vh',
        bgcolor: '#1E1E1E',
        color: '#fff',
      }}
    >
      <Typography variant="h6" sx={{ mb: 2, color: '#fff' }}>
        Agent2Agent Communication
      </Typography>

      <Box sx={{ 
        height: 'calc(100% - 60px)',
        overflowY: 'auto',
        fontFamily: 'monospace',
        fontSize: '0.9rem',
      }}>
        {messages.map((message, index) => (
          <Box key={index} sx={{ mb: 1 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#A0A0A0',
                fontSize: '0.8rem',
              }}
            >
              {new Date().toLocaleTimeString()}
            </Typography>
            <Typography 
              variant="body1"
              sx={{ 
                color: '#00FF00',
                wordBreak: 'break-word',
              }}
            >
              {message}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default AgentCommunication; 
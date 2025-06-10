import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingOverlayProps {
  message?: string;
}

const LoadingOverlay = ({ message = 'Processing...' }: LoadingOverlayProps) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <CircularProgress
        size={60}
        thickness={4}
        sx={{
          color: '#fff',
          mb: 2,
        }}
      />
      <Typography
        variant="h6"
        sx={{
          color: '#fff',
          textAlign: 'center',
          maxWidth: '80%',
          animation: 'fadeInOut 2s infinite',
          '@keyframes fadeInOut': {
            '0%': { opacity: 0.6 },
            '50%': { opacity: 1 },
            '100%': { opacity: 0.6 },
          },
        }}
      >
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingOverlay; 
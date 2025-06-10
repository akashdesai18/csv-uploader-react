import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Box, Container, CssBaseline, ThemeProvider, createTheme, Paper, Typography } from '@mui/material';
import { Description as FileIcon } from '@mui/icons-material';
import PaymanConnect from './components/PaymanConnect';
import CsvUploader from './components/CsvUploader';
import AgentCommunication from './components/AgentCommunication';
import ResultsTable from './components/ResultsTable';
import OAuthCallback from './components/OAuthCallback';
import LoadingOverlay from './components/LoadingOverlay';
import PaymanService from './services/PaymanService';
import type { PaymentData, PaymentResult } from './services/PaymanService';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1B4D3E', // Dark green color from the design
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

function MainApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<PaymentData[]>([]);
  const [results, setResults] = useState<PaymentResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExchangingToken, setIsExchangingToken] = useState(false);

  useEffect(() => {
    // Check for auth success/errors
    const params = new URLSearchParams(location.search);
    if (params.get('success') === 'true') {
      setIsConnected(true);
      addMessage('✅ Successfully connected to Payman!');
      addMessage('You can now upload your CSV file to process payments.');
      // Clear the URL parameter
      navigate('/', { replace: true });
    } else if (params.get('error') === 'auth_failed') {
      addMessage('❌ Failed to connect to Payman');
      navigate('/', { replace: true });
    }
    
    // Check if already connected
    setIsConnected(PaymanService.getInstance().isInitialized());
  }, [location, navigate]);

  const addMessage = (message: string) => {
    setMessages(prev => [...prev, message]);
  };

  const handleFileUpload = (data: PaymentData[]) => {
    // Log the data for debugging
    console.log('Received CSV data:', data);
    
    // Validate each payment before setting
    const validPayments = data.filter(payment => {
      const isValid = payment.payeeName && 
                     payment.amount && 
                     payment.sourceWallet &&
                     // Ensure these aren't header values
                     !payment.payeeName.toLowerCase().includes('payee') &&
                     !payment.amount.toLowerCase().includes('amount') &&
                     !payment.sourceWallet.toLowerCase().includes('source');
      
      if (!isValid) {
        console.log('Filtered out invalid payment:', payment);
      }
      return isValid;
    });

    console.log('Valid payments to process:', validPayments);
    setParsedData(validPayments);
    setShowResults(false);
    addMessage(`CSV file parsed successfully. Found ${validPayments.length} valid payments to process.`);
  };

  const handleProcessPayments = async () => {
    if (parsedData.length === 0) {
      addMessage('❌ No valid payments to process');
      return;
    }

    setIsProcessing(true);
    addMessage(`Processing ${parsedData.length} payments...`);
    
    try {
      const results = await PaymanService.getInstance().processCSVPayments(parsedData);
      setResults(results);
      setShowResults(true);
      addMessage('Payments processed successfully!');
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error occurred';
      addMessage(`❌ Error processing payments: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessAnother = () => {
    setParsedData([]);
    setResults([]);
    setShowResults(false);
    addMessage('Ready to process another file');
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      {(isProcessing || isExchangingToken) && (
        <LoadingOverlay 
          message={isExchangingToken 
            ? "Connecting to Payman..." 
            : "Processing payments..."}
        />
      )}
      <Box sx={{ display: 'flex', gap: 3 }}>
        {/* Main Content */}
        <Box sx={{ flex: 1 }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <FileIcon sx={{ 
                fontSize: 40, 
                color: 'primary.main',
                p: 0.5,
                borderRadius: 1,
                bgcolor: 'primary.light',
                opacity: 0.8
              }} />
              <Typography variant="h4" component="h1">CSV Pay Machine</Typography>
            </Box>
            
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Send love and money with a simple CSV upload
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Transform your spreadsheet into instant payments
            </Typography>

            <PaymanConnect 
              onConnect={() => {
                setIsConnected(true);
                addMessage('Connected to Payman');
              }}
              onDisconnect={() => {
                setIsConnected(false);
                setParsedData([]);
                setResults([]);
                setShowResults(false);
                addMessage('Disconnected from Payman');
              }}
              onTokenExchange={(isExchanging) => {
                setIsExchangingToken(isExchanging);
              }}
            />
          </Paper>
          
          {isConnected && (
            <>
              {!showResults ? (
                <CsvUploader 
                  parsedData={parsedData}
                  onUpload={handleFileUpload}
                  onProcess={handleProcessPayments}
                  isProcessing={isProcessing}
                />
              ) : (
                <ResultsTable 
                  results={results}
                  onProcessAnother={handleProcessAnother}
                />
              )}
            </>
          )}
        </Box>

        {/* Agent Communication Panel */}
        <Box sx={{ width: 350 }}>
          <AgentCommunication messages={messages} />
        </Box>
      </Box>
    </Container>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/oauth/callback" element={<OAuthCallback />} />
          <Route path="/" element={<MainApp />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;

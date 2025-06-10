import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Paper, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import type { PaymentData } from '../services/PaymanService';

interface CsvUploaderProps {
  onUpload: (data: PaymentData[]) => void;
  onProcess: () => void;
  parsedData: PaymentData[];
  isProcessing: boolean;
}

const REQUIRED_HEADERS = ['payee_name', 'amount', 'source_wallet'];

const CsvUploader = ({ onUpload, onProcess, parsedData, isProcessing }: CsvUploaderProps) => {
  const [error, setError] = useState<string | null>(null);

  const validateHeaders = (headers: string[]): boolean => {
    const normalizedHeaders = headers.map(h => h.toLowerCase().trim().replace(/\s+/g, '_'));
    return REQUIRED_HEADERS.every(required => 
      normalizedHeaders.includes(required) || 
      normalizedHeaders.includes(required.replace('_', ''))
    );
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    const file = acceptedFiles[0];
    
    if (file && file.type === 'text/csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const rows = text.split('\n');
          
          // Get and validate headers
          const headers = rows[0].split(',').map(header => header.toLowerCase().trim());
          if (!validateHeaders(headers)) {
            setError('CSV must contain columns: Payee Name, Amount, Source Wallet');
            return;
          }

          // Find column indices
          const payeeNameIndex = headers.findIndex(h => h.includes('payee'));
          const amountIndex = headers.findIndex(h => h.includes('amount'));
          const sourceWalletIndex = headers.findIndex(h => h.includes('source'));
          
          // Parse data rows (skip header row)
          const data = rows.slice(1)
            .filter(row => row.trim()) // Skip empty rows
            .map(row => {
              const values = row.split(',').map(value => value.trim());
              return {
                payeeName: values[payeeNameIndex],
                amount: values[amountIndex],
                sourceWallet: values[sourceWalletIndex]
              };
            })
            .filter(row => row.payeeName && row.amount && row.sourceWallet); // Skip incomplete rows

          if (data.length === 0) {
            setError('No valid payment data found in CSV');
            return;
          }

          onUpload(data);
        } catch (err) {
          setError('Failed to parse CSV file. Please check the format.');
        }
      };
      reader.readAsText(file);
    } else {
      setError('Please upload a valid CSV file');
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false
  });

  return (
    <Paper sx={{ p: 3 }}>
      <Box {...getRootProps()} sx={{
        border: '2px dashed',
        borderColor: isDragActive ? 'primary.main' : 'grey.300',
        borderRadius: 2,
        p: 3,
        mb: 3,
        textAlign: 'center',
        cursor: 'pointer',
        bgcolor: isDragActive ? 'action.hover' : 'background.paper',
        '&:hover': {
          bgcolor: 'action.hover'
        }
      }}>
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Drag & drop your CSV file here
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          or click to select a file
        </Typography>
        <Typography variant="body2" color="text.secondary">
          CSV must have columns: Payee Name, Amount, Source Wallet
        </Typography>
        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </Box>

      {parsedData.length > 0 && (
        <>
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Payee Name</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Source Wallet</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {parsedData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.payeeName}</TableCell>
                    <TableCell>{row.amount}</TableCell>
                    <TableCell>{row.sourceWallet}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={onProcess}
              disabled={parsedData.length === 0 || isProcessing}
            >
              {isProcessing ? 'Processing...' : `Process ${parsedData.length} Payment${parsedData.length > 1 ? 's' : ''}`}
            </Button>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default CsvUploader; 
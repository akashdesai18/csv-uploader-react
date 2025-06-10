import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Paper, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

interface PaymentData {
  payeeName: string;
  amount: string;
  sourceWallet: string;
}

interface CsvUploaderProps {
  onUpload: (data: PaymentData[]) => void;
  onProcess: () => void;
  parsedData: PaymentData[];
  isProcessing: boolean;
}

const CsvUploader = ({ onUpload, onProcess, parsedData, isProcessing }: CsvUploaderProps) => {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    const file = acceptedFiles[0];
    
    if (file && file.type === 'text/csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const rows = text.split('\n');
          const headers = rows[0].split(',').map(header => header.trim());
          
          const data = rows.slice(1)
            .filter(row => row.trim()) // Skip empty rows
            .map(row => {
              const values = row.split(',').map(value => value.trim());
              return {
                payeeName: values[0],
                amount: values[1],
                sourceWallet: values[2]
              };
            });

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
        <Typography variant="body2" color="text.secondary">
          or click to select a file
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
              {isProcessing ? 'Processing...' : 'Process Payments'}
            </Button>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default CsvUploader; 
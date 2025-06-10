import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Button, Box } from '@mui/material';
import { Upload } from '@mui/icons-material';

interface PaymentData {
  payeeName: string;
  amount: string;
  sourceWallet: string;
  status: 'success' | 'error' | 'awaiting_approval';
  error?: string;
  message?: string;
}

interface ResultsTableProps {
  results: PaymentData[];
  onProcessAnother: () => void;
}

const ResultsTable = ({ results, onProcessAnother }: ResultsTableProps) => {
  const successCount = results.filter(r => r.status === 'success').length;
  const awaitingCount = results.filter(r => r.status === 'awaiting_approval').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const totalCount = results.length;

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            💸 Payment Results
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {successCount} successful, {awaitingCount} awaiting approval, {errorCount} failed out of {totalCount} payments
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<Upload />}
          onClick={onProcessAnother}
        >
          Process Another File
        </Button>
      </Box>
      
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Payee Name</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Source Wallet</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{row.payeeName}</TableCell>
                <TableCell>${row.amount}</TableCell>
                <TableCell>{row.sourceWallet}</TableCell>
                <TableCell>
                  {row.status === 'success' ? (
                    <Typography color="success.main" title={row.message}>
                      ✅ Success
                    </Typography>
                  ) : row.status === 'awaiting_approval' ? (
                    <Typography color="warning.main" title={row.message}>
                      ⏳ Awaiting Approval
                    </Typography>
                  ) : (
                    <Typography color="error.main" title={row.error}>
                      ❌ Failed
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default ResultsTable; 
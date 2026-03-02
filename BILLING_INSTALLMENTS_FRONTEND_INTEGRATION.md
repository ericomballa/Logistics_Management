# Billing Installment Payments - Frontend Integration Guide

This document explains how to implement installment payment functionality in the frontend application to work with the backend API.

## API Endpoints Available

### 1. Making Partial or Full Payments
- **Endpoint**: `POST /billing/invoices/:id/payments`
- **Description**: Make a partial or full payment for a specific invoice
- **Request Body**:
```json
{
  "amount": 2000,
  "method": "CASH",
  "notes": "Initial payment for invoice",
  "transactionId": "TXN123456",
  "currency": "XAF",
  "reference": "REF001"
}
```

### 2. Get Payment History for an Invoice
- **Endpoint**: `GET /billing/invoices/:id/payments`
- **Description**: Retrieve all payments made for a specific invoice

### 3. Get Payment Summary for an Invoice
- **Endpoint**: `GET /billing/invoices/:id/payment-summary`
- **Description**: Get comprehensive payment summary including total, paid, balance, and payment history

## Frontend Component Implementation

### 1. Invoice Detail View

Add a payment section to the invoice detail view:

```html
<div class="invoice-details">
  <!-- Existing invoice details -->
  
  <div class="payment-section">
    <h3>Payment Information</h3>
    
    <div class="payment-summary">
      <p><strong>Total Amount:</strong> {{ invoice.total }} XAF</p>
      <p><strong>Amount Paid:</strong> {{ invoice.amountPaid }} XAF</p>
      <p><strong>Remaining Balance:</strong> {{ invoice.balance }} XAF</p>
      <p><strong>Status:</strong> 
        <span class="status-badge" [ngClass]="getStatusClass(invoice.status)">
          {{ invoice.status }}
        </span>
      </p>
    </div>
    
    <!-- Payment Form for Installments -->
    <div class="payment-form" *ngIf="invoice.balance > 0">
      <h4>Make Payment</h4>
      
      <form (ngSubmit)="makePayment()" #paymentForm="ngForm">
        <div class="form-group">
          <label for="amount">Payment Amount (Max: {{ invoice.balance }} XAF)</label>
          <input 
            type="number" 
            id="amount" 
            name="amount"
            [(ngModel)]="paymentData.amount"
            [max]="invoice.balance"
            [min]="1"
            required
            class="form-control">
          <small class="text-muted">Maximum amount you can pay: {{ invoice.balance }} XAF</small>
        </div>
        
        <div class="form-group">
          <label for="method">Payment Method</label>
          <select 
            id="method" 
            name="method"
            [(ngModel)]="paymentData.method"
            required
            class="form-control">
            <option value="">Select Method</option>
            <option value="CASH">Cash</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="MOBILE_MONEY">Mobile Money</option>
            <option value="CREDIT_CARD">Credit Card</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="notes">Notes (Optional)</label>
          <textarea 
            id="notes" 
            name="notes"
            [(ngModel)]="paymentData.notes"
            class="form-control">
          </textarea>
        </div>
        
        <button 
          type="submit" 
          [disabled]="!paymentForm.valid || paymentData.amount <= 0 || paymentData.amount > invoice.balance"
          class="btn btn-primary">
          Process Payment
        </button>
      </form>
    </div>
    
    <!-- Payment History -->
    <div class="payment-history" *ngIf="paymentHistory && paymentHistory.length > 0">
      <h4>Payment History</h4>
      <table class="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Amount</th>
            <th>Method</th>
            <th>Status</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let payment of paymentHistory">
            <td>{{ payment.createdAt | date:'short' }}</td>
            <td>{{ payment.amount }} XAF</td>
            <td>{{ payment.method }}</td>
            <td>{{ payment.status }}</td>
            <td>{{ payment.notes || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>
```

### 2. Component Logic

```typescript
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BillingService } from '../services/billing.service';

@Component({
  selector: 'app-invoice-detail',
  templateUrl: './invoice-detail.component.html'
})
export class InvoiceDetailComponent implements OnInit {
  invoice: any;
  paymentHistory: any[] = [];
  paymentData = {
    amount: 0,
    method: '',
    notes: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private billingService: BillingService
  ) {}

  ngOnInit() {
    const invoiceId = this.route.snapshot.paramMap.get('id');
    this.loadInvoiceDetails(invoiceId!);
  }

  loadInvoiceDetails(invoiceId: string) {
    // Load invoice details
    this.billingService.getInvoice(invoiceId).subscribe(
      (response) => {
        this.invoice = response;
        this.loadPaymentSummary(invoiceId);
      },
      (error) => {
        console.error('Error loading invoice:', error);
      }
    );
  }

  loadPaymentSummary(invoiceId: string) {
    // Load payment summary which includes history
    this.billingService.getInvoicePaymentSummary(invoiceId).subscribe(
      (response) => {
        this.invoice = { ...this.invoice, ...response }; // Merge payment summary with invoice
        this.paymentHistory = response.payments;
      },
      (error) => {
        console.error('Error loading payment summary:', error);
      }
    );
  }

  makePayment() {
    const invoiceId = this.route.snapshot.paramMap.get('id');
    
    // Prepare payment data
    const paymentPayload = {
      ...this.paymentData,
      invoiceId: invoiceId
    };

    // Submit payment
    this.billingService.makePartialPayment(invoiceId!, paymentPayload).subscribe(
      (response) => {
        alert('Payment processed successfully!');
        // Refresh the invoice details and payment history
        this.loadInvoiceDetails(invoiceId!);
        this.paymentData = { amount: 0, method: '', notes: '' }; // Reset form
      },
      (error) => {
        console.error('Payment failed:', error);
        alert(error.error?.message || 'Payment failed. Please try again.');
      }
    );
  }

  getStatusClass(status: string) {
    switch(status) {
      case 'PAID': return 'status-paid';
      case 'PARTIAL': return 'status-partial';
      case 'PENDING': return 'status-pending';
      case 'OVERDUE': return 'status-overdue';
      default: return 'status-default';
    }
  }
}
```

### 3. Service Methods

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BillingService {
  private apiUrl = '/api/billing'; // Adjust to your API base URL

  constructor(private http: HttpClient) {}

  getInvoice(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/invoices/${id}`);
  }

  makePartialPayment(invoiceId: string, paymentData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/invoices/${invoiceId}/payments`, paymentData);
  }

  getInvoicePaymentHistory(invoiceId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/invoices/${invoiceId}/payments`);
  }

  getInvoicePaymentSummary(invoiceId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/invoices/${invoiceId}/payment-summary`);
  }
}
```

### 4. CSS Styling

```css
.payment-section {
  margin-top: 2rem;
  padding: 1.5rem;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  background-color: #f8f9fa;
}

.payment-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: white;
  border-radius: 0.375rem;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-paid {
  background-color: #d4edda;
  color: #155724;
}

.status-partial {
  background-color: #fff3cd;
  color: #856404;
}

.status-pending {
  background-color: #d1ecf1;
  color: #0c5460;
}

.status-overdue {
  background-color: #f8d7da;
  color: #721c24;
}

.payment-form {
  margin: 1.5rem 0;
  padding: 1rem;
  background-color: white;
  border-radius: 0.375rem;
}

.payment-history {
  margin-top: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-control {
  width: 100%;
  padding: 0.375rem 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 0.375rem;
}

.btn {
  padding: 0.375rem 0.75rem;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

## Key Features Implemented in Backend

1. **Installment Support**: Customers can now pay invoices in multiple installments
2. **Balance Tracking**: System tracks remaining balance after each payment
3. **Status Updates**: Invoice status updates automatically (PENDING → PARTIAL → PAID)
4. **Payment History**: Complete record of all payments made toward an invoice
5. **Validation**: Payment amounts cannot exceed remaining balance
6. **Audit Trail**: All payment activities are logged

## Integration Steps for Frontend Development

1. **Update Invoice Detail Page**: Add payment form and history display
2. **Implement Payment Form**: Allow users to enter payment amounts up to the remaining balance
3. **Display Payment Summary**: Show total, paid, and remaining amounts
4. **Handle Status Updates**: Reflect invoice status changes (PENDING, PARTIAL, PAID)
5. **Show Payment History**: Display all previous payments for the invoice
6. **Add Validation**: Prevent payments exceeding the remaining balance

## Error Handling

The backend will return appropriate error messages:
- If payment amount exceeds remaining balance: `"Payment amount (X) exceeds invoice balance (Y). Remaining balance: Z"`
- If payment amount is invalid: `"Payment amount must be positive"`

## Testing the Feature

1. Create an invoice with a specific amount (e.g., 5000 XAF)
2. Make a partial payment (e.g., 2000 XAF)
3. Verify invoice status changes to "PARTIAL" and balance updates to 3000 XAF
4. Make another payment to cover the remaining balance
5. Verify invoice status changes to "PAID" when balance reaches 0

## Updating Invoice Print Modal

The invoice print modal needs to be updated to properly display installment payment information. Here's how to modify the print template:

### 1. Enhanced Invoice Print Template

```html
<div class="invoice-print" #invoicePrintTemplate>
  <div class="invoice-header">
    <div class="company-info">
      <h2>{{ companyInfo.name }}</h2>
      <p>{{ companyInfo.address }}</p>
      <p>{{ companyInfo.phone }} | {{ companyInfo.email }}</p>
    </div>
    <div class="invoice-title">
      <h1>INVOICE</h1>
      <p><strong>Invoice #: </strong>{{ invoice.invoiceNumber }}</p>
      <p><strong>Date: </strong>{{ invoice.createdAt | date:'mediumDate' }}</p>
      <p><strong>Status: </strong>
        <span [ngClass]="getStatusClass(invoice.status)">{{ invoice.status }}</span>
      </p>
    </div>
  </div>

  <div class="invoice-client">
    <h3>Bill To:</h3>
    <p><strong>{{ invoice.clientName || invoice.client?.name }}</strong></p>
    <p>{{ invoice.clientAddress || invoice.client?.address }}</p>
  </div>

  <div class="invoice-items">
    <table class="items-table">
      <thead>
        <tr>
          <th>Description</th>
          <th>Quantity</th>
          <th>Unit Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let item of invoice.items">
          <td>{{ item.description }}</td>
          <td>{{ item.quantity }}</td>
          <td>{{ item.unitPrice | currency:'XAF':'symbol-narrow' }}</td>
          <td>{{ item.total | currency:'XAF':'symbol-narrow' }}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Payment Summary Section -->
  <div class="payment-summary-section">
    <h3>Payment Summary</h3>
    <div class="payment-breakdown">
      <div class="breakdown-row">
        <span>Subtotal:</span>
        <span>{{ invoice.subtotal | currency:'XAF':'symbol-narrow' }}</span>
      </div>
      <div class="breakdown-row">
        <span>Tax ({{ invoice.taxPercentage || 0 }}%):</span>
        <span>{{ invoice.tax | currency:'XAF':'symbol-narrow' }}</span>
      </div>
      <div class="breakdown-row">
        <span>Discount:</span>
        <span>-{{ invoice.discount | currency:'XAF':'symbol-narrow' }}</span>
      </div>
      <div class="breakdown-row total">
        <span><strong>Total Amount:</strong></span>
        <span><strong>{{ invoice.total | currency:'XAF':'symbol-narrow' }}</strong></span>
      </div>
      
      <!-- Installment Payment Information -->
      <div class="breakdown-row paid">
        <span><strong>Amount Paid:</strong></span>
        <span><strong>{{ invoice.amountPaid | currency:'XAF':'symbol-narrow' }}</strong></span>
      </div>
      <div class="breakdown-row balance" *ngIf="invoice.balance > 0">
        <span><strong>Remaining Balance:</strong></span>
        <span><strong>{{ invoice.balance | currency:'XAF':'symbol-narrow' }}</strong></span>
      </div>
      <div class="breakdown-row paid-date" *ngIf="invoice.paidAt">
        <span><strong>Paid Date:</strong></span>
        <span><strong>{{ invoice.paidAt | date:'mediumDate' }}</strong></span>
      </div>
    </div>
  </div>

  <!-- Payment History Section -->
  <div class="payment-history-section" *ngIf="paymentHistory && paymentHistory.length > 0">
    <h3>Payment History</h3>
    <table class="payment-history-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Amount</th>
          <th>Method</th>
          <th>Reference</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let payment of paymentHistory">
          <td>{{ payment.createdAt | date:'shortDate' }}</td>
          <td>{{ payment.amount | currency:'XAF':'symbol-narrow' }}</td>
          <td>{{ payment.method }}</td>
          <td>{{ payment.reference || payment.transactionId || '-' }}</td>
          <td><span [ngClass]="getPaymentStatusClass(payment.status)">{{ payment.status }}</span></td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="invoice-footer">
    <p><strong>Thank you for your business!</strong></p>
    <p *ngIf="invoice.balance > 0"><em>Please note: This invoice has a remaining balance of {{ invoice.balance | currency:'XAF':'symbol-narrow' }}.</em></p>
  </div>
</div>

<!-- Print Button -->
<button (click)="printInvoice()" class="btn btn-primary print-btn">
  <i class="fas fa-print"></i> Print Invoice
</button>
```

### 2. Component Logic for Print Modal

```typescript
import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { BillingService } from '../services/billing.service';

@Component({
  selector: 'app-invoice-print-modal',
  templateUrl: './invoice-print-modal.component.html'
})
export class InvoicePrintModalComponent {
  @ViewChild('invoicePrintTemplate', { static: false }) invoicePrintTemplate!: ElementRef;
  
  @Input() invoiceId: string = '';
  invoice: any = {};
  paymentHistory: any[] = [];

  constructor(private billingService: BillingService) {}

  ngOnChanges() {
    if (this.invoiceId) {
      this.loadInvoiceDetails();
    }
  }

  loadInvoiceDetails() {
    // Load invoice details
    this.billingService.getInvoice(this.invoiceId).subscribe(
      (invoiceResponse) => {
        this.invoice = invoiceResponse;
        
        // Load payment history to show in the print view
        this.billingService.getInvoicePaymentHistory(this.invoiceId).subscribe(
          (historyResponse) => {
            this.paymentHistory = historyResponse;
          },
          (error) => {
            console.error('Error loading payment history:', error);
            // Even if payment history fails, we can still show the invoice
          }
        );
      },
      (error) => {
        console.error('Error loading invoice:', error);
      }
    );
  }

  printInvoice() {
    const printContents = this.invoicePrintTemplate.nativeElement.innerHTML;
    const originalContents = document.body.innerHTML;

    document.body.innerHTML = `
      <html>
        <head>
          <title>Invoice ${this.invoice.invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .invoice-header { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .invoice-header h1 { color: #333; margin: 0; }
            .invoice-items table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .invoice-items th, .invoice-items td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .invoice-items th { background-color: #f2f2f2; }
            .payment-summary-section { margin: 20px 0; }
            .breakdown-row { display: flex; justify-content: space-between; margin: 5px 0; }
            .breakdown-row.total { border-top: 2px solid #333; padding-top: 10px; font-size: 1.1em; }
            .breakdown-row.paid { color: #28a745; font-weight: bold; }
            .breakdown-row.balance { color: #dc3545; font-weight: bold; }
            .payment-history-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .payment-history-table th, .payment-history-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .payment-history-table th { background-color: #f2f2f2; }
            .status-badge { padding: 2px 6px; border-radius: 4px; font-size: 0.8em; }
            .status-paid { background-color: #d4edda; color: #155724; }
            .status-pending { background-color: #d1ecf1; color: #0c5460; }
            .status-partial { background-color: #fff3cd; color: #856404; }
          </style>
        </head>
        <body>${printContents}</body>
      </html>
    `;

    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload(); // Refresh to restore the app state
  }

  getStatusClass(status: string) {
    switch(status) {
      case 'PAID': return 'status-paid';
      case 'PARTIAL': return 'status-partial';
      case 'PENDING': return 'status-pending';
      case 'OVERDUE': return 'status-overdue';
      default: return 'status-default';
    }
  }

  getPaymentStatusClass(status: string) {
    switch(status) {
      case 'COMPLETED': return 'status-paid';
      case 'PENDING': return 'status-pending';
      case 'FAILED': return 'status-overdue';
      case 'REFUNDED': return 'status-refunded';
      default: return 'status-default';
    }
  }
}
```

### 3. CSS for Print Optimization

```css
@media print {
  body * {
    visibility: hidden;
  }
  
  .invoice-print, .invoice-print * {
    visibility: visible;
  }
  
  .invoice-print {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
  
  .print-btn {
    display: none;
  }
  
  /* Optimize layout for printing */
  .invoice-header {
    page-break-inside: avoid;
  }
  
  .payment-history-section {
    page-break-before: auto;
  }
}

/* Screen styles */
.invoice-print {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: white;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
}

.payment-summary-section {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 5px;
  margin: 15px 0;
}

.payment-history-section {
  margin-top: 20px;
  overflow-x: auto;
}

.breakdown-row.total {
  border-top: 2px solid #333;
  padding-top: 10px;
  font-weight: bold;
}

.breakdown-row.paid {
  color: #28a745;
}

.breakdown-row.balance {
  color: #dc3545;
  font-weight: bold;
}
```

### 4. Key Improvements for Installment Payments

The updated print modal now includes:

1. **Clear Payment Summary**: Shows total amount, amount paid, and remaining balance
2. **Payment History Table**: Lists all payments made toward the invoice with dates and methods
3. **Status Indicators**: Visual indicators for payment status
4. **Print Optimization**: Proper CSS for printing with page breaks
5. **Balance Highlighting**: When there's a remaining balance, it's prominently displayed
6. **Paid Date**: Shows when the invoice was fully paid (if applicable)

This ensures that when customers receive printed invoices, they can clearly see:
- The original invoice amount
- How much has been paid so far
- What remains to be paid
- A complete history of all payments made
- The current status of the invoice

The print modal now fully reflects the installment payment features implemented in the backend.

## Important Backend Fix Applied

I've also applied an important fix to the backend service to resolve an issue that was causing payment creation failures. The issue was related to how the invoiceId was being assigned in the payment creation process. This has been corrected to ensure reliable payment processing for both full and installment payments.
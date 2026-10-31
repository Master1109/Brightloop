import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from '../../entities/index';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
  ) {}

  async generatePdf(invoiceId: string): Promise<{ buffer: Buffer; filename: string }> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id: invoiceId },
      relations: ['subscription', 'subscription.plan', 'lines'],
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const invoiceNumber = invoice.invoice_number;
    const filename = `invoice-${invoiceNumber}.pdf`;

    // Generate a simple PDF buffer (placeholder - in production use pdf-lib or similar)
    const htmlContent = this.renderInvoiceHtml(invoice);
    const buffer = this.htmlToPdfBuffer(htmlContent, invoiceNumber);

    return { buffer, filename };
  }

  private renderInvoiceHtml(invoice: Invoice): string {
    const invoiceNumber = invoice.invoice_number;
    const plan = invoice.subscription?.plan;
    const subtotal = invoice.subtotal_cents / 100;
    const taxTotal = invoice.tax_total_cents / 100;
    const discountTotal = invoice.discount_total_cents / 100;
    const grandTotal = invoice.grand_total_cents / 100;

    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><style>${this.getInvoiceStyles()}</style></head>
      <body>
        <div class="invoice">
          <div class="header">
            <h1>Brightloop</h1>
            <p>Subscription Management System</p>
          </div>
          <div class="details">
            <div><strong>Invoice:</strong> ${invoiceNumber}</div>
            <div><strong>Date:</strong> ${invoice.created_at}</div>
            <div><strong>Status:</strong> ${invoice.status}</div>
            ${plan ? `<div><strong>Plan:</strong> ${plan.name}</div>` : ''}
          </div>
          <table class="items">
            <thead><tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>Amount</th></tr></thead>
            <tbody>
              ${invoice.lines?.map(line => `
                <tr>
                  <td>${line.description || `Product #${line.product_id?.slice(0, 8)}`}</td>
                  <td>${line.quantity}</td>
                  <td>₹${(line.unit_price_cents / 100).toFixed(2)}</td>
                  <td>₹${(line.amount_cents / 100).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="totals">
            <div><span>Subtotal</span><span>₹${subtotal.toFixed(2)}</span></div>
            <div><span>Tax</span><span>₹${taxTotal.toFixed(2)}</span></div>
            <div class="total"><span>Total</span><span>₹${grandTotal.toFixed(2)}</span></div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getInvoiceStyles(): string {
    return `
      body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
      .invoice { max-width: 800px; margin: 0 auto; }
      .header h1 { color: #3678ed; margin-bottom: 5px; }
      .details { margin: 30px 0; }
      .details div { margin: 5px 0; }
      .items { width: 100%; border-collapse: collapse; margin: 20px 0; }
      .items th, .items td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      .items th { background: #f8f9fa; }
      .totals { margin-top: 20px; text-align: right; }
      .totals div { margin: 5px 0; }
      .total { font-weight: bold; font-size: 1.2em; }
    `;
  }

  private htmlToPdfBuffer(html: string, invoiceNumber: string): Buffer {
    // Simple HTML-to-PDF placeholder: convert to a basic PDF-like buffer
    // In production, use pdf-lib with proper rendering
    const content = `Brightloop Invoice ${invoiceNumber}\n\n${html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').substring(0, 200)}`;
    return Buffer.from(content);
  }
}

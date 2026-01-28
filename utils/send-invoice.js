// utils/send-invoice.js
import PDFDocument from 'pdfkit';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';

export default async function sendInvoice(order, customerEmail) {
  try {
    // --- PDF Generation ---
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));

    const pdfPromise = new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
    });

    // PDF Content
    const logoPath = path.join(process.cwd(), 'public', 'img', 'Amazon.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 45, { width: 100 });
    }
    doc.moveDown(2);

    doc.fontSize(20).text('Amazon Arbirtage', { align: 'center' });
    doc.moveDown();
    doc.fontSize(16).text(`Invoice #${order.displayId}`);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
    doc.moveDown();

    doc.fontSize(14).text('Customer Details:');
    doc.text(`Name: ${order.customer.name}`);
    doc.text(`Email: ${order.customer.email}`);
    doc.text(`Phone: ${order.customer.phone}`);
    const addr = order.customer.address;
    doc.text(`Address: ${addr.street}, ${addr.city}, ${addr.state}, ${addr.zip}, ${addr.country}`);
    doc.moveDown();

    doc.fontSize(14).text('Delivery Details:');
    doc.text(`Delivery Date: ${order.deliveryDate}`);
    doc.text(`Delivery Slot: ${order.deliverySlot}`);
    doc.moveDown();

    doc.fontSize(14).text('Payment Method:');
    doc.text(order.method === 1 ? 'Stripe' : 'Cash on Delivery');
    doc.moveDown();

    if (order.notes) {
      doc.fontSize(14).text('Order Notes:');
      doc.text(order.notes);
      doc.moveDown();
    }

    doc.fontSize(14).text('Items:', { underline: true });
    order.items.forEach((item, index) => {
      doc.text(
        `${index + 1}. ${item.title} x ${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`,
      );
      if (item.notes) doc.text(`   Item Notes: ${item.notes}`);
      if (item.extras?.length) {
        item.extras.forEach((e) => {
          doc.text(`   Extra: ${e.text} - $${e.price.toFixed(2)}`);
        });
      }
    });

    doc.moveDown();
    doc.text(`Subtotal: $${order.subtotal.toFixed(2)}`);
    if (order.discount) doc.text(`Discount: -$${order.discount.toFixed(2)}`);
    doc.text(`Tax: $${order.tax.toFixed(2)}`);
    doc.text(`Shipping: $${order.shippingFee?.toFixed(2) || 0}`);
    doc.moveDown();
    doc.fontSize(16).text(`Total: $${order.total.toFixed(2)}`, { align: 'right' });

    doc.end();
    const pdfData = await pdfPromise;

    // --- Debug SMTP config ---
    console.log('SMTP Config', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      passLength: process.env.SMTP_PASS?.length,
    });

    // --- Nodemailer setup ---
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // --- Send Email ---
    await transporter.sendMail({
      from: `"Amazon Arbirtage" <${process.env.SMTP_USER}>`,
      to: customerEmail,
      subject: `Your Invoice #${order.displayId}`,
      text: `Hello ${order.customer.name},\n\nThank you for your order! Your invoice is attached.\n\nTotal: $${order.total}\nDelivery: ${order.deliveryDate} (${order.deliverySlot})\n\n- Amazon Arbirtage`,
      attachments: [
        {
          filename: `Invoice-${order.displayId}.pdf`,
          content: pdfData,
          contentType: 'application/pdf',
        },
      ],
    });

    console.log('Invoice sent successfully to', customerEmail);
    return true;
  } catch (err) {
    console.error('sendInvoice error:', err);
    return false; // don’t throw, just log
  }
}

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    const result = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html,
    });
    console.log("[v0] Email sent:", result.messageId);
    return result;
  } catch (error) {
    console.error("[v0] Error sending email:", error);
    throw error;
  }
}

export const emailTemplates = {
  rentDue: (tenantName: string, amount: number, dueDate: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Rent Payment Due</h2>
      <p>Hi ${tenantName},</p>
      <p>Your rent payment of $${amount.toFixed(2)} is due on <strong>${dueDate}</strong>.</p>
      <p>Please ensure payment is made on time.</p>
      <p>Best regards,<br>Your Landlord</p>
    </div>
  `,

  rentPaid: (tenantName: string, amount: number, paymentDate: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Rent Payment Received</h2>
      <p>Hi ${tenantName},</p>
      <p>We have received your rent payment of $${amount.toFixed(2)} on ${paymentDate}.</p>
      <p>Thank you for your prompt payment.</p>
      <p>Best regards,<br>Your Landlord</p>
    </div>
  `,

  maintenanceRequest: (
    tenantName: string,
    title: string,
    description: string
  ) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Maintenance Request Received</h2>
      <p>Hi ${tenantName},</p>
      <p>We have received your maintenance request:</p>
      <p><strong>${title}</strong></p>
      <p>${description}</p>
      <p>We will get back to you shortly with updates.</p>
      <p>Best regards,<br>Your Landlord</p>
    </div>
  `,

  maintenanceComplete: (
    tenantName: string,
    title: string,
    cost: number | null
  ) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Maintenance Completed</h2>
      <p>Hi ${tenantName},</p>
      <p>Your maintenance request "<strong>${title}</strong>" has been completed.</p>
      ${cost ? `<p>Cost: $${cost.toFixed(2)}</p>` : ""}
      <p>If you have any questions, please don't hesitate to contact us.</p>
      <p>Best regards,<br>Your Landlord</p>
    </div>
  `,

  leaseExpiring: (
    tenantName: string,
    leaseEndDate: string,
    propertyAddress: string
  ) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Lease Expiration Notice</h2>
      <p>Hi ${tenantName},</p>
      <p>This is a reminder that your lease for <strong>${propertyAddress}</strong> expires on <strong>${leaseEndDate}</strong>.</p>
      <p>Please contact us to discuss lease renewal or move-out arrangements.</p>
      <p>Best regards,<br>Your Landlord</p>
    </div>
  `,
};

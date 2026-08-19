import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

/**
 * Service d'envoi d'emails via SMTP (Nodemailer).
 *
 * Comportement selon la configuration :
 * - Variables SMTP présentes → transporter SMTP réel (production)
 * - Variables SMTP absentes  → transporter mock (développement)
 *   Les emails sont loggés dans la console sans être envoyés.
 *
 * Configuration requise (via .env) :
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  /**
   * Initialise le transporter SMTP ou un mock selon la configuration disponible.
   * Appelé une seule fois au démarrage via le constructeur.
   */
  private initializeTransporter() {
    const smtpHost     = this.configService.get<string>('SMTP_HOST');
    const smtpPort     = this.configService.get<number>('SMTP_PORT');
    const smtpUser     = this.configService.get<string>('SMTP_USER');
    const smtpPassword = this.configService.get<string>('SMTP_PASSWORD');

    if (smtpHost && smtpUser && smtpPassword) {
      // Mode production : transporter SMTP réel
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort || 587,
        secure: false, // STARTTLS (port 587) — mettre true pour SSL (port 465)
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      });
      this.logger.log('Email service initialized with SMTP');
    } else {
      // Mode développement : mock qui logue dans la console
      this.logger.warn('Email service not configured - running in mock mode');
      this.transporter = {
        sendMail: async (options: nodemailer.SendMailOptions) => {
          this.logger.log(`[MOCK EMAIL] To: ${options.to}, Subject: ${options.subject}`);
          this.logger.log(`[MOCK EMAIL] Content: ${options.text}`);
          return { messageId: 'mock-message-id' } as nodemailer.SentMessageInfo;
        },
      } as nodemailer.Transporter;
    }
  }

  /**
   * Envoie un email générique.
   *
   * @param to      - Adresse email du destinataire.
   * @param subject - Sujet du mail.
   * @param text    - Corps en texte brut (fallback pour clients sans HTML).
   * @param html    - Corps en HTML optionnel.
   * @throws Propage l'erreur Nodemailer si l'envoi échoue.
   */
  async sendEmail(to: string, subject: string, text: string, html?: string): Promise<void> {
    const from = this.configService.get<string>('SMTP_FROM', 'noreply@smartagenda.com');

    try {
      await this.transporter.sendMail({ from, to, subject, text, html });
      this.logger.log(`Email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }

  /** Envoie l'email de confirmation de rendez-vous (texte + HTML). */
  async sendAppointmentConfirmation(
    email: string,
    userName: string,
    appointmentDetails: { subject: string; date: string; time: string },
  ): Promise<void> {
    const subject = 'Appointment Confirmed - SmartAgenda';
    const text = `
Dear ${userName},

Your appointment has been confirmed:

Subject: ${appointmentDetails.subject}
Date: ${appointmentDetails.date}
Time: ${appointmentDetails.time}

Please make sure to attend on time. If you need to reschedule, please contact us.

Best regards,
SmartAgenda Team
    `;
    const html = `
      <h2>Appointment Confirmed</h2>
      <p>Dear ${userName},</p>
      <p>Your appointment has been confirmed:</p>
      <ul>
        <li><strong>Subject:</strong> ${appointmentDetails.subject}</li>
        <li><strong>Date:</strong> ${appointmentDetails.date}</li>
        <li><strong>Time:</strong> ${appointmentDetails.time}</li>
      </ul>
      <p>Please make sure to attend on time. If you need to reschedule, please contact us.</p>
      <p>Best regards,<br>SmartAgenda Team</p>
    `;
    await this.sendEmail(email, subject, text, html);
  }

  /** Envoie l'email d'annulation de rendez-vous (texte + HTML). */
  async sendAppointmentCancellation(
    email: string,
    userName: string,
    appointmentDetails: { subject: string; date: string },
  ): Promise<void> {
    const subject = 'Appointment Cancelled - SmartAgenda';
    const text = `
Dear ${userName},

Your appointment has been cancelled:

Subject: ${appointmentDetails.subject}
Date: ${appointmentDetails.date}

If you did not request this cancellation, please contact us immediately.

Best regards,
SmartAgenda Team
    `;
    const html = `
      <h2>Appointment Cancelled</h2>
      <p>Dear ${userName},</p>
      <p>Your appointment has been cancelled:</p>
      <ul>
        <li><strong>Subject:</strong> ${appointmentDetails.subject}</li>
        <li><strong>Date:</strong> ${appointmentDetails.date}</li>
      </ul>
      <p>If you did not request this cancellation, please contact us immediately.</p>
      <p>Best regards,<br>SmartAgenda Team</p>
    `;
    await this.sendEmail(email, subject, text, html);
  }

  /** Envoie l'email de nouvelle demande de rendez-vous à l'enseignant (texte + HTML). */
  async sendNewAppointmentRequest(
    email: string,
    userName: string,
    appointmentDetails: { studentName: string; subject: string; date: string; time: string },
  ): Promise<void> {
    const subject = 'New Appointment Request - SmartAgenda';
    const text = `
Dear ${userName},

You have received a new appointment request:

Student: ${appointmentDetails.studentName}
Subject: ${appointmentDetails.subject}
Date: ${appointmentDetails.date}
Time: ${appointmentDetails.time}

Please log in to SmartAgenda to review and confirm this request.

Best regards,
SmartAgenda Team
    `;
    const html = `
      <h2>New Appointment Request</h2>
      <p>Dear ${userName},</p>
      <p>You have received a new appointment request:</p>
      <ul>
        <li><strong>Student:</strong> ${appointmentDetails.studentName}</li>
        <li><strong>Subject:</strong> ${appointmentDetails.subject}</li>
        <li><strong>Date:</strong> ${appointmentDetails.date}</li>
        <li><strong>Time:</strong> ${appointmentDetails.time}</li>
      </ul>
      <p>Please log in to SmartAgenda to review and confirm this request.</p>
      <p>Best regards,<br>SmartAgenda Team</p>
    `;
    await this.sendEmail(email, subject, text, html);
  }
}

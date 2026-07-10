import { Injectable } from "@nestjs/common";
import * as nodemailer from "nodemailer";

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || "smtp.gmail.com",
      port: parseInt(process.env.MAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.MAIL_USER || "your-email@gmail.com",
        pass: process.env.MAIL_PASSWORD || "your-app-password",
      },
    });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const mailOptions = {
      from: process.env.MAIL_FROM || "noreply@nexusedu.com",
      to: email,
      subject: "Welcome to NexusEdu",
      html: `
        <h1>Welcome to NexusEdu, ${name}!</h1>
        <p>Thank you for registering. We're excited to have you on board.</p>
        <p>You can now login and start exploring our courses.</p>
        <a href="${process.env.APP_URL || "http://localhost:3000"}/login">Login to NexusEdu</a>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendAssignmentSubmittedEmail(
    teacherEmail: string,
    studentName: string,
    assignmentName: string,
  ): Promise<void> {
    const mailOptions = {
      from: process.env.MAIL_FROM || "noreply@nexusedu.com",
      to: teacherEmail,
      subject: `New Assignment Submission: ${assignmentName}`,
      html: `
        <h2>New Assignment Submission</h2>
        <p><strong>${studentName}</strong> has submitted the assignment: <strong>${assignmentName}</strong></p>
        <p>Please review and provide feedback.</p>
        <a href="${process.env.APP_URL || "http://localhost:3000"}/dashboard">View in Dashboard</a>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendGradeReleaseEmail(
    studentEmail: string,
    studentName: string,
    assignmentName: string,
    grade: number,
  ): Promise<void> {
    const mailOptions = {
      from: process.env.MAIL_FROM || "noreply@nexusedu.com",
      to: studentEmail,
      subject: `Your Grade for ${assignmentName}`,
      html: `
        <h2>Grade Released</h2>
        <p>Hello ${studentName},</p>
        <p>Your grade for <strong>${assignmentName}</strong> has been released.</p>
        <p><strong>Grade: ${grade}</strong></p>
        <a href="${process.env.APP_URL || "http://localhost:3000"}/dashboard/results">View Your Results</a>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendCourseEnrollmentEmail(
    studentEmail: string,
    studentName: string,
    courseName: string,
  ): Promise<void> {
    const mailOptions = {
      from: process.env.MAIL_FROM || "noreply@nexusedu.com",
      to: studentEmail,
      subject: `Enrollment Confirmed: ${courseName}`,
      html: `
        <h2>Course Enrollment Confirmed</h2>
        <p>Hello ${studentName},</p>
        <p>You have successfully enrolled in <strong>${courseName}</strong></p>
        <p>You can now start learning and tracking your progress.</p>
        <a href="${process.env.APP_URL || "http://localhost:3000"}/dashboard/courses">View Your Courses</a>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendDirectMessageEmail(
    recipientEmail: string,
    recipientName: string,
    senderName: string,
    messagePreview: string,
  ): Promise<void> {
    const mailOptions = {
      from: process.env.MAIL_FROM || "noreply@nexusedu.com",
      to: recipientEmail,
      subject: `New Message from ${senderName}`,
      html: `
        <h2>New Message</h2>
        <p>Hello ${recipientName},</p>
        <p><strong>${senderName}</strong> sent you a message:</p>
        <p>"${messagePreview}"</p>
        <a href="${process.env.APP_URL || "http://localhost:3000"}/messages">View All Messages</a>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }
}

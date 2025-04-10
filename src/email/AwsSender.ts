import * as aws from 'aws-sdk';
import * as nodemailer from 'nodemailer';
import { EmailSender } from './EmailSender';
import { EmailData, AwsConfig } from './types';
import { SendEmailRequest } from 'aws-sdk/clients/ses';

// aws ses implementation
export class AwsSender extends EmailSender {
  private ses: aws.SES;

  constructor(config: AwsConfig) {
    super();
    // create ses service object
    this.ses = new aws.SES({
      apiVersion: '2010-12-01',
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  // send email using aws ses
  async send(emailData: EmailData): Promise<any> {
    try {
      // handle emails with attachments
      if (emailData.attachments && emailData.attachments.length > 0) {
        return this.sendWithAttachments(emailData);
      } else {
        return this.sendSimpleEmail(emailData);
      }
    } catch (error) {
      throw new Error(`failed to send email with aws ses: ${error}`);
    }
  }

  // send simple email without attachments
  private async sendSimpleEmail(emailData: EmailData): Promise<any> {
    // prepare the parameters for sending email
    const params: SendEmailRequest = {
      Source: emailData.from,
      Destination: {
        ToAddresses: Array.isArray(emailData.to) ? emailData.to : [emailData.to],
      },
      Message: {
        Subject: {
          Data: emailData.subject,
        },
        Body: {},
      },
    };

    // add text content if provided
    if (emailData.text) {
      params.Message.Body['Text'] = {
        Data: emailData.text,
      };
    }

    // add html content if provided
    if (emailData.html) {
      params.Message.Body['Html'] = {
        Data: emailData.html,
      };
    }

    // send email without attachments using standard ses.sendEmail
    return await this.ses.sendEmail(params).promise();
  }

  // send email with attachments using raw email
  private async sendWithAttachments(emailData: EmailData): Promise<any> {
    // for ses, we need to use sendRawEmail for attachments
    // create a nodemailer transporter to generate raw email
    const rawMailer = nodemailer.createTransport({
      SES: this.ses,
    });

    // send raw email with attachments
    return await rawMailer.sendMail({
      from: emailData.from,
      to: Array.isArray(emailData.to) ? emailData.to.join(',') : emailData.to,
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html,
      attachments: emailData.attachments,
    });
  }

  // check if aws ses credentials are valid
  async verifyCredentials(): Promise<boolean> {
    try {
      await this.ses.getSendQuota().promise();
      return true;
    } catch (error) {
      console.error('AWS SES credentials are invalid:', error);
      return false;
    }
  }
}

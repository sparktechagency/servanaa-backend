/* eslint-disable no-undef */
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join((process.cwd(), '.env')) });

export default {
  NODE_ENV: process.env.NODE_ENV,
  port: process.env.PORT,
  database_url: process.env.DATABASE_URL,
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
  default_password: process.env.DEFAULT_PASS,
  jwt_access_secret: process.env.JWT_ACCESS_SECRET,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
  jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN,
  jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN,
  reset_pass_ui_link: process.env.RESET_PASS_UI_LINK,
  admin_email_user: process.env.ADMIN_EMAIL_USER,
  email_app_password: process.env.EMAIL_APP_PASSWORD,
  super_admin_email: process.env.SUPER_ADMIN_EMAIL, 
  super_admin_password: process.env.SUPER_ADMIN_PASSWORD,
  stripe_webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
  stripe_secret_key: process.env.STRIPE_SECRET_KEY,
  mailbox_layer_key: process.env.MAILBOXLAYER_KEY,
  mailbox_layer_url: process.env.MAILBOXLAYER_URL,
  account_sid: process.env.TWILIO_ACCOUNT_SID,
  auth_token: process.env.TWILIO_AUTH_TOKEN,
  twilio_phone_number: process.env.TWILIO_PHONE_NUMBER,
  s3: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    bucket: process.env.AWS_BUCKET_NAME,
    endpoint: process.env.AWS_ENDPOINT,
    s3ForcePathStyle: true,
    sslEnabled: true,
    signatureVersion: 'v4'
  },
};





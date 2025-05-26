/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import config from "../config/index";



export const emailValidate = async(email: string) => {
// console.log(process.env.MAILBOXLAYER_API_URL, "process.env.MAILBOXLAYER_API_URL")

     const emailValidationResponse = await axios.get(config.mailbox_layer_url as any, {
        params: {
          access_key: config.mailbox_layer_key as any,
          email: email,
          smtp: 1,
          format: 1,
        },
      });
  
      const validation = emailValidationResponse.data;
  
      if (!validation.format_valid) {
        throw new Error('Invalid email format.');
      }
  
      if (!validation.mx_found) {
        throw new Error('Email domain does not have valid mail servers.');
      }
  
      if (!validation.smtp_check) {
        throw new Error('Email cannot receive emails.');
      }
  
      if (validation.disposable) {
        throw new Error('Disposable email addresses are not allowed.');
      }
  
      if (validation.role) {
        throw new Error('Role-based email addresses are not allowed.');
      }
  
      if (validation.score < 0.7) {
        throw new Error('Email validation score is too low, indicating an unreliable email.');
      }

      return true
}
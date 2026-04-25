"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSignatureHTML = void 0;
// server/src/templates/Signature.ts
const generateSignatureHTML = (options = {}) => {
    const { name = "Gaurav Khadka", title = "Marketing Representative", phone = "+977 1 4541620", mobile = "+977 9861810789", email = "gaurav@webtech.com.np", website = "https://www.webtechnepal.com", address = "Hattigauda, Kathmandu, Nepal", showDisclaimer = true } = options;
    // Extract domain from website URL for display
    const websiteDisplay = website.replace(/^https?:\/\/(www\.)?/, '');
    return `
<div class="signature" style="font-family: Arial, sans-serif; font-size: 13px; color: #333; line-height: 1.4;  margin-top: 20px; padding-top: 20px; ">
  <table class="sig-table" style="border-collapse: collapse;">
    <tr>
      <!-- Left logo -->
      <td class="sig-left" style="padding-right: 15px; vertical-align: top;">
        <img src="https://api.webtech.mobi.np/src/assets/wtnsignaturelogo.png" alt="Webtech Nepal Logo" style="width:120px">
      </td>

         <td style="background:linear-gradient(to top,#ff0080,#ff8c00,#40e0d0); width: 2.5px;"></td>
      
      <!-- Right content -->
      <td class="sig-right" style="padding-left: 15px; vertical-align: top;">
        <div class="sig-title" style="color: #313131; font-size: 16px; font-weight: bold; margin-bottom: 10px;">${title}</div>

        <div class="sig-info" style="margin: 4px 0; font-size: 11px; color:#666666;text-decoration:none;">
          <span style="font-weight: bold; color: #000; ">P:</span> ${phone} &nbsp; 
          <span style="font-weight: bold; color: #000;">M:</span> ${mobile}
        </div>
        <div class="sig-info" style="margin: 4px 0; font-size: 11px; color:#666666;text-decoration:none;">
          <span style="font-weight: bold; color: #000;">E:</span> <a href="mailto:${email}">${email}</a> &nbsp; 
          <span style="font-weight: bold; color: #000;">W:</span> <a href="${website}">${websiteDisplay}</a>
        </div>
        <div class="sig-info" style="margin: 4px 0; font-size: 11px; color:#666666;text-decoration:none;">
          <span style="font-weight: bold; color: #000; ">A:</span> ${address}
        </div>

      <!-- Social icons -->
<div style="margin-top: 12px; display: flex; align-items: center; gap: 4px;">
  <a href="https://www.facebook.com/WebTechnologyNepal/" style="display: flex; align-items: center; justify-content: center; margin-right: 4px;">
    <img src="https://api.webtech.mobi.np/src/assets/facebook.png" alt="Facebook" style="width: 20px; height: 20px; object-fit: contain;">
  </a>
  <a href="https://www.linkedin.com/company/webtechnepal/" style="display: flex; align-items: center; justify-content: center; margin-right: 4px;">
    <img src="https://api.webtech.mobi.np/src/assets/linkedin.png" alt="LinkedIn" style="width: 20px; height: 20px; object-fit: contain;">
  </a>
  <a href="https://x.com/webtechnepal/" style="display: flex; align-items: center; justify-content: center; margin-right: 4px;">
    <img src="https://api.webtech.mobi.np/src/assets/x.png" alt="X" style="width: 20px; height: 20px; object-fit: contain;">
  </a>
  <a href="https://www.youtube.com/user/webtechnepals/" style="display: flex; align-items: center; justify-content: center; margin-right: 4px;">
    <img src="https://api.webtech.mobi.np/src/assets/youtube.png" alt="YouTube" style="width: 20px; height: 20px; object-fit: contain;">
  </a>
  <a href="https://www.instagram.com/webtechnepal/" style="display: flex; align-items: center; justify-content: center; margin-right: 4px;">
    <img src="https://api.webtech.mobi.np/src/assets/instagram.png" alt="Instagram" style="width: 20px; height: 20px; object-fit: contain;">
  </a>
</div>
      </td>
    </tr>
  </table>

  <!-- Disclaimer -->
  ${showDisclaimer ? `
  <div class="disclaimer" 
  style="color:gray;font-size:10px;padding:0px 4px;margin:0px;font-family:&quot;Courier New&quot;,Courier,mono"
  >
    <b>*DISCLAIMER*</b><br>
    This email, including any attachments, is private and confidential.<br>
    It should not be read, copied, disclosed, or otherwise used by anyone other than the intended recipient(s). 
    If you have received this email in error, please notify the sender immediately.<br><br>
    Please don't print this email unless you have to. Save the environment and save yourself some cash too!
  </div>
  ` : ''}
</div>
`;
};
exports.generateSignatureHTML = generateSignatureHTML;

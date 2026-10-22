package com.medicycle.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleCredential;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.gmail.Gmail;
import com.google.api.services.gmail.model.Message;
import jakarta.mail.Session;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Properties;

@Slf4j
@Service
public class EmailService {

    @Value("${GMAIL_FROM_EMAIL:}")
    private String fromEmail;

    @Value("${GMAIL_CLIENT_ID:}")
    private String gmailClientId;

    @Value("${GMAIL_CLIENT_SECRET:}")
    private String gmailClientSecret;

    @Value("${GMAIL_REFRESH_TOKEN:}")
    private String gmailRefreshToken;

    @Value("${app.base-url:http://localhost:5173}")
    private String baseUrl;

    @Async
    public void sendVerificationEmail(String to, String name, String token) {
        String verificationLink = baseUrl + "/api/auth/verify?token=" + token;
        String subject = "Verify your MediCycle account";
        String body = String.format("""
                Hello %s,

                Thank you for registering with MediCycle.

                Please verify your email address by clicking the link below:
                %s

                This link will expire in 24 hours.

                If you did not create an account, please ignore this email.

                Best regards,
                MediCycle Team
                """, name, verificationLink);

        sendEmail(to, subject, body);
    }

    @Async
    public void sendPasswordResetEmail(String to, String name, String token) {
        String resetLink = baseUrl + "/reset-password?token=" + token;
        String subject = "Reset your MediCycle password";
        String body = String.format("""
                Hello %s,

                We received a request to reset your MediCycle password.

                Click the link below to set a new password:
                %s

                This link will expire in 1 hour.

                If you did not request a password reset, please ignore this email. Your password will remain unchanged.

                Best regards,
                MediCycle Team
                """, name, resetLink);

        sendEmail(to, subject, body);
    }

    @Async
    public void sendTwoFactorCodeEmail(String to, String code) {
        String subject = "Your MediCycle 2FA Code";
        String body = String.format("""
                Your verification code is: %s

                This code will expire in 5 minutes.

                If you did not request this code, please ignore this email.
                """, code);

        sendEmail(to, subject, body);
    }

    @Async
    public void sendAccountVerificationStatusEmail(
            String to, String name, String roleName, boolean accepted, String remarks) {

        String roleDisplay = "User";
        if ("DOCTOR".equalsIgnoreCase(roleName)) {
            roleDisplay = "Doctor";
        } else if ("PHARMACY".equalsIgnoreCase(roleName)) {
            roleDisplay = "Pharmacy";
        } else if ("DONOR".equalsIgnoreCase(roleName)) {
            roleDisplay = "Donor";
        } else if ("RECIPIENT".equalsIgnoreCase(roleName)) {
            roleDisplay = "Recipient";
        }

        String loginUrl = baseUrl + "/login";
        String subject;
        String body;

        if (accepted) {
            subject = "🎉 Your MediCycle " + roleDisplay + " Account Has Been Approved!";
            body = String.format(
                    """
                            Hello %s,

                            Congratulations! Your MediCycle %s application and verification documents have been reviewed and APPROVED by our administrative team.

                            You now have full access to your portal and features.

                            You can log in to your account here:
                            %s

                            %s
                            Best regards,
                            The MediCycle Administrative Team
                            """,
                    name,
                    roleDisplay,
                    loginUrl,
                    (remarks != null && !remarks.isBlank())
                            ? "Admin Remarks: " + remarks + "\n\n"
                            : "");
        } else {
            subject = "MediCycle " + roleDisplay + " Verification Application Status: Rejected";
            body = String.format(
                    """
                            Hello %s,

                            Thank you for applying to MediCycle.

                            After reviewing your submitted credentials and documents, we regret to inform you that your %s verification request was NOT approved at this time.

                            Reason / Feedback:
                            %s

                            You can log in to your portal to review requirements, update your credentials, and re-submit your documents:
                            %s

                            If you believe this was an error, please reply to this email or re-submit with the updated documents.

                            Best regards,
                            The MediCycle Administrative Team
                            """,
                    name,
                    roleDisplay,
                    (remarks != null && !remarks.isBlank())
                            ? remarks
                            : "Submitted credentials could not be verified. Please ensure valid official documents are uploaded.",
                    loginUrl);
        }

        sendEmail(to, subject, body);
    }

    @Async
    public void sendDonationStatusEmail(
            String to, String name, String medicineName, boolean accepted, String remarks) {

        String subject;
        String body;

        if (accepted) {
            subject = "✅ Medicine Donation Approved: " + medicineName;
            body = String.format("""
                    Hello %s,

                    Great news! Your donation of "%s" has been inspected and APPROVED by our verifying partner.

                    It has now been added to the MediCycle medicine inventory pool to help patients in need.

                    Thank you for your generous contribution!

                    %s
                    Best regards,
                    The MediCycle Team
                    """,
                    name,
                    medicineName,
                    (remarks != null && !remarks.isBlank())
                            ? "Partner Remarks: " + remarks + "\n\n"
                            : "");
        } else {
            subject = "MediCycle Donation Status Update: " + medicineName;
            body = String.format(
                    """
                            Hello %s,

                            Thank you for submitting your donation of "%s" to MediCycle.

                            Following physical or documentary inspection, this donation could not be accepted into the active pool.

                            Reason:
                            %s

                            Thank you for your understanding.

                            Best regards,
                            The MediCycle Team
                            """,
                    name,
                    medicineName,
                    (remarks != null && !remarks.isBlank())
                            ? remarks
                            : "Does not meet safety or expiry guidelines.");
        }

        sendEmail(to, subject, body);
    }

    @Async
    public void sendMedicineRequestStatusEmail(
            String to, String name, String medicineName, boolean accepted, String remarks) {

        String subject;
        String body;

        if (accepted) {
            subject = "✅ Medicine Request Approved: " + medicineName;
            body = String.format(
                    """
                            Hello %s,

                            Your request for "%s" has been APPROVED!

                            You can now view your approval details and QR code on your dashboard to collect your medicine from the designated pharmacy partner:
                            %s/recipient/requests

                            %s
                            Best regards,
                            The MediCycle Team
                            """,
                    name,
                    medicineName,
                    baseUrl,
                    (remarks != null && !remarks.isBlank())
                            ? "Remarks: " + remarks + "\n\n"
                            : "");
        } else {
            subject = "MediCycle Medicine Request Status: " + medicineName;
            body = String.format("""
                    Hello %s,

                    Regarding your request for "%s" on MediCycle:

                    We regret to inform you that your request could not be fulfilled at this time.

                    Reason:
                    %s

                    You can check other available medicines in the pool or submit a new request:
                    %s/recipient/medicines

                    Best regards,
                    The MediCycle Team
                    """,
                    name,
                    medicineName,
                    (remarks != null && !remarks.isBlank())
                            ? remarks
                            : "Prescription verification could not be completed or stock unavailable.",
                    baseUrl);
        }

        sendEmail(to, subject, body);
    }

    @Async
    public void sendAppointmentStatusEmail(
            String to,
            String patientName,
            String doctorName,
            String specialty,
            String consultationType,
            String status,
            String notes) {

        String subject;
        String body;

        if ("CONFIRMED".equalsIgnoreCase(status) || "APPROVED".equalsIgnoreCase(status)) {
            subject = "✅ Doctor Consultation Request Accepted - MediCycle";
            body = String.format(
                    """
                            Hello %s,

                            Great news! Your medical consultation request has been ACCEPTED and CONFIRMED.

                            Consultation Details:
                            - Doctor: %s
                            - Specialty: %s
                            - Mode: %s
                            - Status: CONFIRMED

                            %s
                            The doctor will reach out to you via WhatsApp / phone at the scheduled time. You can also view consultation updates on your MediCycle portal:
                            %s

                            Best regards,
                            MediCycle Healthcare Team
                            """,
                    patientName,
                    (doctorName != null && !doctorName.isBlank())
                            ? "Dr. " + doctorName
                            : "Registered Specialist",
                    (specialty != null && !specialty.isBlank())
                            ? specialty
                            : "General Consultation",
                    (consultationType != null && !consultationType.isBlank())
                            ? consultationType
                            : "Consultation",
                    (notes != null && !notes.isBlank())
                            ? "Patient Notes / Details: " + notes + "\n\n"
                            : "",
                    baseUrl);
        } else if ("CANCELLED".equalsIgnoreCase(status) || "REJECTED".equalsIgnoreCase(status)) {
            subject = "MediCycle Consultation Request Status: Declined / Cancelled";
            body = String.format(
                    """
                            Hello %s,

                            Regarding your consultation request for %s (%s):

                            We regret to inform you that the requested doctor is unable to take this appointment, and your request has been DECLINED.

                            %s
                            You can book a consultation with another doctor or check other available specialists on MediCycle:
                            %s

                            Best regards,
                            MediCycle Healthcare Team
                            """,
                    patientName,
                    (specialty != null && !specialty.isBlank())
                            ? specialty
                            : "Medical Consultation",
                    (consultationType != null && !consultationType.isBlank())
                            ? consultationType
                            : "Consultation",
                    (notes != null && !notes.isBlank())
                            ? "Reason / Notes: " + notes + "\n\n"
                            : "",
                    baseUrl);
        } else if ("COMPLETED".equalsIgnoreCase(status)) {
            subject = "✅ Doctor Consultation Completed - MediCycle";
            body = String.format("""
                    Hello %s,

                    Your consultation with %s has been marked as COMPLETED.

                    We hope your consultation went smoothly! Thank you for choosing MediCycle.

                    Best regards,
                    MediCycle Healthcare Team
                    """,
                    patientName,
                    (doctorName != null && !doctorName.isBlank())
                            ? "Dr. " + doctorName
                            : "the specialist");
        } else {
            return;
        }

        sendEmail(to, subject, body);
    }

    private void sendEmail(String to, String subject, String text) {
        if (to == null || to.isBlank()) {
            log.error("Email recipient is empty. Email was not sent.");
            return;
        }

        if (isBlank(fromEmail)
                || isBlank(gmailClientId)
                || isBlank(gmailClientSecret)
                || isBlank(gmailRefreshToken)) {
            log.error("Gmail OAuth configuration is incomplete. Email was not sent.");
            return;
        }

        try {
            var transport = GoogleNetHttpTransport.newTrustedTransport();
            var jsonFactory = GsonFactory.getDefaultInstance();

            GoogleCredential credential = new GoogleCredential.Builder()
                    .setTransport(transport)
                    .setJsonFactory(jsonFactory)
                    .setClientSecrets(gmailClientId, gmailClientSecret)
                    .build()
                    .setRefreshToken(gmailRefreshToken);

            Gmail gmail = new Gmail.Builder(transport, jsonFactory, credential)
                    .setApplicationName("MediCycle")
                    .build();

            MimeMessage email = new MimeMessage(Session.getInstance(new Properties()));
            email.setFrom(new InternetAddress(fromEmail));
            email.setRecipient(jakarta.mail.Message.RecipientType.TO, new InternetAddress(to));
            email.setSubject(subject, StandardCharsets.UTF_8.name());
            email.setText(text, StandardCharsets.UTF_8.name());
            email.saveChanges();

            ByteArrayOutputStream output = new ByteArrayOutputStream();
            email.writeTo(output);

            String encodedEmail = Base64.getUrlEncoder()
                    .withoutPadding()
                    .encodeToString(output.toByteArray());

            Message gmailMessage = new Message().setRaw(encodedEmail);

            gmail.users()
                    .messages()
                    .send("me", gmailMessage)
                    .execute();

            log.info("Gmail API accepted email for recipient: {}", to);
        } catch (Exception e) {
            // Avoid logging OAuth tokens or message contents.
            log.error("Gmail API email sending failed: {}", e.getMessage());
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}

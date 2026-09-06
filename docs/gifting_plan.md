# Gifting & On-Behalf Donations Plan

## Objective
Allow users to donate to a charity on behalf of someone else (a friend, family member, or colleague). The recipient will receive a new building in their personal city and an email notification. If they don't have an account yet, the building will be waiting for them when they sign up with that email.

## Flow & User Experience

1. **Initiate Gift:** 
   - On the `CampaignList` UI, the user checks a box: "[ ] Donate as a gift / on behalf of someone".
   - An input field appears: "Recipient Email or Username".
   - The user inputs the email/username and clicks "Donate".
   - *Note: Since the donor doesn't know the recipient's city grid layout, the building will be placed in a special "Gifts Queue" or auto-placed in the next available empty grid slot in the recipient's city.*

2. **Data Model Updates:**
   - Modify the `buildings` table to include:
     - `gifted_by_id UUID REFERENCES profiles(id)` (Null if not a gift)
     - `recipient_email TEXT` (If the user doesn't have an account yet)
   - Or, create a separate `gifts` table to hold pending gifts until the user logs in.

3. **Webhook Processing (Server Authority):**
   - When the Every.org webhook fires, we check the `partner_metadata` for `recipientEmail`.
   - We query the `profiles` table to see if a user with that email exists (this requires mapping auth emails to profiles, or searching via the Admin Auth API).
   - **If user exists:** The building is immediately added to their `cities` table.
   - **If user does NOT exist:** The building is stored with `recipient_email`. We have a Postgres trigger `on_auth_user_created` that will check for pending gifts matching the new user's email and attach them to their new city.

4. **In-Game Experience:**
   - The recipient logs in and sees a new building.
   - Hovering over the building in the Phaser Game triggers a tooltip: *"Gifted by [Donor Username] on [Date]"*.

5. **Email Notifications:**
   - We will use Supabase Edge Functions or a Next.js API route to send a transactional email (e.g., via Resend or SendGrid) when the webhook successfully processes a gift.
   - **Email Body:** "Surprise! [Donor] just donated to [Charity] on your behalf. A new [Building Type] has been added to your city! Log in to see it grow."

6. **Birthdays & Reminders:**
   - Instead of complex automated payments, we keep it simple.
   - Users can go to a "Friends" tab and click "Add Birthday Reminder" next to an email.
   - A `reminders` table stores `(donor_id, recipient_email, date)`.
   - A daily cron job checks this table and emails the donor: "It's [Email]'s birthday tomorrow! Gift them a Hospital in Outgive."

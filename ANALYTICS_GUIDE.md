# How to Track User Behavior (Analytics Guide)

You have successfully added tracking to your app. Here is how to view the data and what to do next.

## 1. Google Analytics 4 (Already Active)
Your app is already sending data to Google Analytics (`G-PSDHTVX94M`).

### How to View Data:
1.  Go to [analytics.google.com](https://analytics.google.com).
2.  Navigate to **Reports > Realtime**.
3.  Open your app and click around. You should see "Users in last 30 minutes" increase.

### New Custom Events We Added:
*   `calculate_fare`: Shows which vehicle types (SUV vs Sedan) and trip modes (OneWay vs RoundTrip) are most popular.
*   `share_app`: Tells you if your "Viral Marketing" strategy is working (Header vs SideNav clicks).
*   `screen_view`: Shows which tab is most used (Calculator vs Invoices).

## 2. Microsoft Clarity (Recommended for "Stuck" Users)
To see *exactly* where users get stuck (rage clicks, dead see), we recommend **Microsoft Clarity**. It is free forever.

### Setup Steps (Do this yourself):
1.  Go to [clarity.microsoft.com](https://clarity.microsoft.com) and sign up.
2.  Create a project named "Sarathi Book".
3.  It will give you a "Tracking Code" (script).
4.  Copy that code and paste it into your `index.html` file inside the `<head>` tag.

### Why do this?
*   **Heatmaps:** You will see a "Heatmap" of your Calculator. If everyone is clicking the "Map" button but it's not working, the heatmap will show red spots there.
*   **Session Replay:** You can watch a video of a user trying to make an invoice and failing. This is the **best way** to improve your UI.

## 3. How to Improve (The Loop)
1.  **Check Weekly:** Look at the `calculate_fare` event.
    *   *Insight:* "80% of users are checking 'Outstation' rates but only 10% calculate 'Local Drop'."
    *   *Action:* Focus your next update on improving the Outstation features.
2.  **Watch Recordings:** If you see users filling the form and then leaving without saving, maybe the form is too long?
    *   *Action:* Hide optional fields.

## 4. Privacy Note
We have implemented this ensuring **User Privacy**. We do not track personal PII (Customer Names, Phone Numbers) in these analytics events.

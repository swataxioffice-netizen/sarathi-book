# GST Compliance Guide for Transport & Cab Drivers

## 1. Compliance Basics
For cab drivers and transport agencies (Rent-a-Cab) in India, GST compliance depends on your business model.

### **Option A: 5% GST (Without Input Tax Credit)**
- **Most Common**: This is what most Uber/Ola/Independent drivers use.
- **Rate**: 5%
- **Input Tax Credit (ITC)**: **NOT Available**. You cannot claim GST paid on fuel, car purchase, or insurance.
- **Who pays?**:
  - If you serve an **individual**: You collect 5% and pay the govt.
  - If you serve a **company (Registered Entity)**: The company pays GST directly to the government under **Reverse Charge Mechanism (RCM)**. 
  - **Exception**: If you are an "Electronic Commerce Operator" (like Uber/Ola), the platform pays. But if you are independent or run a small agency, **Auto-RCM** often applies for corporate clients.

### **Option B: 12% GST (With Input Tax Credit)**
- **Rate**: 12%
- **ITC**: **Available**. You CAN claim tax paid on vehicle purchase, insurance, etc.
- **Best for**: Large fleet owners buying many new cars.

## 2. Implementing "Porter-like" Auto-Fill
You asked how Porter auto-fills details. They use **GSTIN Public APIs**.
We have implemented this feature for you in the **Profile** section!

### **How it works in your App:**
1.  Go to **Profile > Business Details**.
2.  Enter a 15-digit GSTIN (e.g., `29ABCDE1234F1Z5`).
3.  Click **"Auto-Fill"**.
4.  The app fetches the Legal Name and Address and fills the form.

### **Tech Implementation:**
- We created a `GSTService` in `src/services/gst.ts`.
- It currently uses a **Mock Database** for demonstration (try `29ABCDE1234F1Z5`).
- To make it live, you need to sign up for a **GST Suvidha Provider (GSP)** API like:
    - **AppyFlow**
    - **Razorpay GST**
    - **Surepass**
- Once you have an API Key, update `src/services/gst.ts` to call their endpoint.

## 3. Invoice Compliance
To make your Invoices GST compliant (`Tax Invoice`):
1.  **Header**: Must say "TAX INVOICE".
2.  **Your Details**: Name, Address, GSTIN, PAN.
3.  **Customer Details**: Name, Address, GSTIN (if registered).
4.  **Place of Supply**: State Name.
5.  **SAC Code**: Service Accounting Code.
    - **9964**: Passenger transport services.
    - **9966**: Renting of vehicles with operator.
6.  **Tax Breakup**: SGST + CGST (if same state) OR IGST (if different state).

### **Action Items for You:**
- [x] Use the new "Auto-Fill" feature in Profile to set up your business.
- [ ] Ensure `Tax Invoice` mode is selected in the App when generating bills for corporate clients.
- [ ] Add your bank details so they appear on the invoice.

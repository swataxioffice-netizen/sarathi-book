import SEOHead from './SEOHead';

const PrivacyPolicy = () => {
    return (
        <div className="bg-slate-50 min-h-screen pb-20">
            <SEOHead
                title="Privacy Policy | Sarathi Book - Data Protection & Security"
                description="Our privacy policy details how we collect, use, and protect your data at Sarathi Book. Your trust is our priority."
            />

            <div className="bg-white border-b border-slate-200 py-16 px-6">
                <div className="max-w-3xl mx-auto text-center">
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4">Privacy Policy</h1>
                    <p className="text-slate-500 font-medium">Last Updated: February 11, 2026</p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-12 bg-white mt-8 rounded-3xl border border-slate-200 shadow-sm">
                <div className="prose prose-slate prose-sm max-w-none space-y-8">
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4">1. Introduction</h2>
                        <p className="text-slate-600 leading-relaxed font-medium">
                            Welcome to Sarathi Book ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website sarathibook.com.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4">2. Information We Collect</h2>
                        <p className="text-slate-600 leading-relaxed font-bold mb-2">Personal Information</p>
                        <p className="text-slate-600 leading-relaxed font-medium mb-4">
                            We may collect personal information that you voluntarily provide to us when you register on the website, such as your name, email address, phone number, and vehicle details.
                        </p>
                        <p className="text-slate-600 leading-relaxed font-bold mb-2">Log Data</p>
                        <p className="text-slate-600 leading-relaxed font-medium">
                            Our servers automatically collect information when you access our site, such as your IP address, browser type, and the pages you visit.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4">3. Use of Your Information</h2>
                        <p className="text-slate-600 leading-relaxed font-medium">
                            We use the information we collect to:
                        </p>
                        <ul className="list-disc pl-5 text-slate-600 font-medium space-y-2 mt-2">
                            <li>Provide, operate, and maintain our website and tools</li>
                            <li>Develop new products, services, features, and functionality</li>
                            <li>Generate invoices and quotations as per your request</li>
                            <li>Communicate with you regarding updates or support</li>
                            <li>Prevent fraud and ensure security</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4">4. Third-Party Services</h2>
                        <p className="text-slate-600 leading-relaxed font-medium">
                            We use third-party services like Google AdSense to serve advertisements. These services may use cookies and web beacons to collect data about your visits to this and other websites in order to provide advertisements about goods and services of interest to you.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4">5. Cookies</h2>
                        <p className="text-slate-600 leading-relaxed font-medium">
                            We use "cookies" to collect information and improve our services. You have the option to either accept or refuse these cookies, and know when a cookie is being sent to your computer.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4">6. Security</h2>
                        <p className="text-slate-600 leading-relaxed font-medium">
                            We value your trust in providing us with your Personal Information, thus we are striving to use commercially acceptable means of protecting it. But remember that no method of transmission over the internet, or method of electronic storage is 100% secure and reliable.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4">7. Contact Us</h2>
                        <p className="text-slate-600 leading-relaxed font-medium">
                            If you have any questions or suggestions about our Privacy Policy, do not hesitate to contact us at support@sarathibook.com.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;

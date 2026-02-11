import SEOHead from './SEOHead';

const TermsOfService = () => {
    return (
        <div className="bg-slate-50 min-h-screen pb-20">
            <SEOHead
                title="Terms of Service | Sarathi Book - Usage Rules & Agreements"
                description="Read our terms of service to understand the rules and guidelines for using the Sarathi Book platform and its business tools."
            />

            <div className="bg-white border-b border-slate-200 py-16 px-6">
                <div className="max-w-3xl mx-auto text-center">
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4">Terms of Service</h1>
                    <p className="text-slate-500 font-medium">Last Updated: February 11, 2026</p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-12 bg-white mt-8 rounded-3xl border border-slate-200 shadow-sm">
                <div className="prose prose-slate prose-sm max-w-none space-y-8">
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4">1. Acceptance of Terms</h2>
                        <p className="text-slate-600 leading-relaxed font-medium">
                            By accessing or using sarathibook.com, you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions, then you may not access the website or use any services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4">2. Use License</h2>
                        <p className="text-slate-600 leading-relaxed font-medium">
                            Permission is granted to temporarily use the tools on Sarathi Book for personal, non-commercial business use (such as generating invoices for your taxi business). This is the grant of a license, not a transfer of title.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4">3. Disclaimer</h2>
                        <p className="text-slate-600 leading-relaxed font-medium">
                            The materials on our website are provided on an 'as is' basis. Sarathi Book makes no warranties, expressed or implied, and hereby disclaims all other warranties including, without limitation, implied warranties of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4">4. Limitations</h2>
                        <p className="text-slate-600 leading-relaxed font-medium">
                            In no event shall Sarathi Book or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on our website.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4">5. Revisions and Errata</h2>
                        <p className="text-slate-600 leading-relaxed font-medium">
                            The materials appearing on sarathibook.com could include technical, typographical, or photographic errors. We do not warrant that any of the materials on its website are accurate, complete, or current.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4">6. Links</h2>
                        <p className="text-slate-600 leading-relaxed font-medium">
                            Sarathi Book has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by us.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4">7. Governing Law</h2>
                        <p className="text-slate-600 leading-relaxed font-medium">
                            Any claim relating to sarathibook.com shall be governed by the laws of India without regard to its conflict of law provisions.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;

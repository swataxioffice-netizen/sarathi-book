import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

const FAQ_ITEMS = [
    {
        question: "How is the cab fare calculated?",
        answer: "Fares are calculated based on the official union tariffs for different vehicle types (Hatchback, Sedan, SUV, etc.). The final estimate includes base fare per km, driver bata (allowance), estimated tolls, and state permits where applicable."
    },
    {
        question: "What is 'Driver Bata'?",
        answer: "Driver Bata is a standard daily allowance paid to drivers for their food and expenses during a trip. It is usually higher for outstation trips and varies based on the vehicle type."
    },
    {
        question: "Are tolls and parking charges included in the estimate?",
        answer: "Yes, our advanced calculator estimates tolls based on the route provided by Google Maps. However, parking charges are usually estimated based on popular locations and may vary in real-time."
    },
    {
        question: "Why do prices vary for 'One Way' and 'Round Trip'?",
        answer: "One-way trips are often higher per km because the driver has to return empty, while round trips offer a more economical per-km rate as the return distance is also paid for."
    },
    {
        question: "Is GST included in the cab fare?",
        answer: "Usually, cab fares attract a 5% GST if booked through a registered aggregator. Our calculator has a toggle to add GST to your final estimate for professional invoicing."
    }
];

const CalculatorFAQ = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <HelpCircle size={14} />
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide leading-none">Frequently Asked Questions</h3>
                        <p className="text-[9px] text-slate-400 font-medium uppercase tracking-widest mt-0.5">Common queries about cab pricing</p>
                    </div>
                </div>
            </div>

            <div className="divide-y divide-slate-100">
                {FAQ_ITEMS.map((item, index) => (
                    <div key={index} className="group">
                        <button
                            onClick={() => setOpenIndex(openIndex === index ? null : index)}
                            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                        >
                            <span className="text-[11px] font-semibold text-slate-600 group-hover:text-blue-600 transition-colors pr-3">{item.question}</span>
                            {openIndex === index ? <ChevronUp size={13} className="text-blue-500 shrink-0" /> : <ChevronDown size={13} className="text-slate-300 shrink-0" />}
                        </button>
                        {openIndex === index && (
                            <div className="px-4 pb-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                <p className="text-[11px] text-slate-500 leading-relaxed">
                                    {item.answer}
                                </p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CalculatorFAQ;

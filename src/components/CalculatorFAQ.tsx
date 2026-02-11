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
        question: "Is GST included in the taxi fare?",
        answer: "Usually, taxi fares attract a 5% GST if booked through a registered aggregator. Our calculator has a toggle to add GST to your final estimate for professional invoicing."
    }
];

const CalculatorFAQ = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <div className="mt-12 bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-6 py-6 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <HelpCircle size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none">Frequently Asked Questions</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Common queries about taxi pricing</p>
                    </div>
                </div>
            </div>

            <div className="divide-y divide-slate-100">
                {FAQ_ITEMS.map((item, index) => (
                    <div key={index} className="group">
                        <button
                            onClick={() => setOpenIndex(openIndex === index ? null : index)}
                            className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                        >
                            <span className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{item.question}</span>
                            {openIndex === index ? <ChevronUp size={16} className="text-blue-600" /> : <ChevronDown size={16} className="text-slate-300" />}
                        </button>
                        {openIndex === index && (
                            <div className="px-6 pb-6 animate-in fade-in slide-in-from-top-2 duration-200">
                                <p className="text-sm text-slate-500 leading-relaxed font-medium">
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

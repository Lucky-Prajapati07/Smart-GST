"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Language options
export const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
  { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
];

// Translation keys type
export type TranslationKey = 
  | 'hero.badge'
  | 'hero.title'
  | 'hero.subtitle'
  | 'hero.description'
  | 'hero.cta.primary'
  | 'hero.cta.secondary'
  | 'hero.trust.freeTrial'
  | 'hero.trust.security'
  | 'hero.trust.accuracy'
  | 'hero.trust.customers'
  | 'stats.returns'
  | 'stats.customers'
  | 'stats.accuracy'
  | 'stats.savings'
  | 'features.title'
  | 'features.subtitle'
  | 'features.aiPowered.title'
  | 'features.aiPowered.description'
  | 'features.autoCalculation.title'
  | 'features.autoCalculation.description'
  | 'features.compliantReturns.title'
  | 'features.compliantReturns.description'
  | 'features.realTimeValidation.title'
  | 'features.realTimeValidation.description'
  | 'features.smartReminders.title'
  | 'features.smartReminders.description'
  | 'features.auditTrail.title'
  | 'features.auditTrail.description'
  | 'howItWorks.title'
  | 'howItWorks.subtitle'
  | 'howItWorks.step1.title'
  | 'howItWorks.step1.description'
  | 'howItWorks.step2.title'
  | 'howItWorks.step2.description'
  | 'howItWorks.step3.title'
  | 'howItWorks.step3.description'
  | 'testimonials.title'
  | 'testimonials.subtitle'
  | 'testimonials.comment1'
  | 'testimonials.name1'
  | 'testimonials.business1'
  | 'testimonials.comment2'
  | 'testimonials.name2'
  | 'testimonials.business2'
  | 'testimonials.comment3'
  | 'testimonials.name3'
  | 'testimonials.business3'
  | 'supportedReturns.title'
  | 'supportedReturns.subtitle'
  | 'expertSupport.title'
  | 'expertSupport.subtitle'
  | 'expertSupport.phone.title'
  | 'expertSupport.phone.number'
  | 'expertSupport.phone.hours'
  | 'expertSupport.phone.available'
  | 'expertSupport.phone.emergency'
  | 'expertSupport.phone.description'
  | 'expertSupport.phone.contact'
  | 'expertSupport.phone.cta'
  | 'expertSupport.email.title'
  | 'expertSupport.email.description'
  | 'expertSupport.email.contact'
  | 'expertSupport.email.address'
  | 'expertSupport.email.guarantee'
  | 'expertSupport.email.online'
  | 'expertSupport.email.cta'
  | 'expertSupport.chat.title'
  | 'expertSupport.chat.description'
  | 'expertSupport.chat.contact'
  | 'expertSupport.office.title'
  | 'expertSupport.office.location'
  | 'expertSupport.office.district'
  | 'expertSupport.office.open'
  | 'expertSupport.office.cta'
  | 'expertSupport.bottomText'
  | 'cta.title'
  | 'cta.subtitle'
  | 'cta.feature1'
  | 'cta.feature2'
  | 'cta.feature3'
  | 'cta.trustText'
  | 'cta.button'
  | 'footer.description'
  | 'footer.product.title'
  | 'footer.product.features'
  | 'footer.product.pricing'
  | 'footer.product.integrations'
  | 'footer.product.api'
  | 'footer.support.title'
  | 'footer.support.help'
  | 'footer.support.documentation'
  | 'footer.support.training'
  | 'footer.support.contact'
  | 'footer.company.title'
  | 'footer.company.about'
  | 'footer.company.careers'
  | 'footer.company.blog'
  | 'footer.company.press'
  | 'footer.rights'
  | 'footer.legal.privacy'
  | 'footer.legal.terms'
  | 'footer.legal.cookies'
  | 'navbar.features'
  | 'navbar.pricing'
  | 'navbar.help'
  | 'navbar.login'
  | 'navbar.signup';

// Translations
const translations: Record<string, Record<TranslationKey, string>> = {
  en: {
    'hero.badge': 'Now with AI-Powered GST Filing - Join 50,000+ Businesses',
    'hero.title': 'GST Filing',
    'hero.subtitle': 'Made Simple & Smart',
    'hero.description': "India's most advanced GST platform powered by Artificial Intelligence. File returns in minutes, not hours. Join 50,000+ successful businesses already saving time and money.",
    'hero.cta.primary': 'Start Free Trial',
    'hero.cta.secondary': 'Watch Live Demo',
    'hero.trust.freeTrial': 'Free 30-Day Trial',
    'hero.trust.security': 'Bank-Grade Security',
    'hero.trust.accuracy': '99.9% Accuracy',
    'hero.trust.customers': '50,000+ Happy Customers',
    'stats.returns': '1M+',
    'stats.customers': '50K+',
    'stats.accuracy': '99.9%',
    'stats.savings': '₹50K+',
    'features.title': 'Why 50,000+ Businesses Choose Us',
    'features.subtitle': 'Experience the future of GST compliance with our AI-powered platform built specifically for Indian businesses',
    'features.aiPowered.title': 'AI-Powered Filing',
    'features.aiPowered.description': 'Our advanced AI automatically detects errors, optimizes your returns, and ensures 100% compliance with the latest GST regulations.',
    'features.autoCalculation.title': 'Auto Tax Calculation',
    'features.autoCalculation.description': 'Smart algorithms calculate your tax liability automatically, reducing human errors and saving precious time for your business.',
    'features.compliantReturns.title': 'Always Compliant Returns',
    'features.compliantReturns.description': 'Stay updated with real-time regulatory changes and file returns that are always compliant with the latest government guidelines.',
    'features.realTimeValidation.title': 'Real-time Validation',
    'features.realTimeValidation.description': 'Instant validation of your data against GST database ensures error-free filing and reduces chances of notices.',
    'features.smartReminders.title': 'Smart Reminders',
    'features.smartReminders.description': 'Never miss a deadline with intelligent reminders and notifications tailored to your business filing schedule.',
    'features.auditTrail.title': 'Complete Audit Trail',
    'features.auditTrail.description': 'Maintain detailed records of all transactions and changes with our comprehensive audit trail system for complete transparency.',
    'howItWorks.title': 'How It Works',
    'howItWorks.subtitle': 'Get started in 3 simple steps and experience hassle-free GST filing',
    'howItWorks.step1.title': 'Upload Your Data',
    'howItWorks.step1.description': 'Simply upload your sales and purchase data or connect your accounting software for automatic data import.',
    'howItWorks.step2.title': 'AI Processing',
    'howItWorks.step2.description': 'Our AI engine processes your data, validates information, and prepares your GST returns with 99.9% accuracy.',
    'howItWorks.step3.title': 'File & Done',
    'howItWorks.step3.description': 'Review and file your returns directly to the GST portal. Get acknowledgment and store records securely.',
    'testimonials.title': 'What Our Customers Say',
    'testimonials.subtitle': 'Join thousands of satisfied businesses who have transformed their GST compliance',
    'testimonials.comment1': 'This platform reduced our GST filing time from 5 hours to just 20 minutes. The AI-powered features are incredible and have saved us thousands in compliance costs.',
    'testimonials.name1': 'Rajesh Kumar',
    'testimonials.business1': 'CEO, Kumar Industries',
    'testimonials.comment2': 'The automated error detection caught mistakes that would have cost us penalty fees. Best investment we made for our accounting process.',
    'testimonials.name2': 'Priya Sharma',
    'testimonials.business2': 'Finance Head, Sharma Textiles',
    'testimonials.comment3': 'Customer support is outstanding and the platform is incredibly user-friendly. Our entire team adapted to it within days.',
    'testimonials.name3': 'Amit Patel',
    'testimonials.business3': 'Owner, Patel Trading Co.',
    'supportedReturns.title': 'All GST Returns Supported',
    'supportedReturns.subtitle': 'Complete GST compliance solution with support for all return types',
    'expertSupport.title': 'Get Expert Support',
    'expertSupport.subtitle': 'Our GST specialists are here to help you succeed. Connect with us anytime, anywhere.',
    'expertSupport.phone.title': 'Phone Support',
    'expertSupport.phone.description': 'Speak directly with our GST experts for immediate assistance',
    'expertSupport.phone.contact': '+91 1800-123-4567',
    'expertSupport.phone.number': '+91 1800-123-4567',
    'expertSupport.phone.hours': 'Mon-Sat, 9 AM - 7 PM',
    'expertSupport.phone.available': 'Available Now',
    'expertSupport.phone.emergency': '24/7',
    'expertSupport.phone.cta': 'Call Now',
    'expertSupport.email.title': 'Email Support',
    'expertSupport.email.description': 'Get detailed help via email with documentation and guides',
    'expertSupport.email.contact': 'support@smartgst.com',
    'expertSupport.email.address': 'support@gstfiling.com',
    'expertSupport.email.guarantee': '24/7 Response Guarantee',
    'expertSupport.email.online': 'Always Online',
    'expertSupport.email.cta': 'Send Email',
    'expertSupport.chat.title': 'Live Chat',
    'expertSupport.chat.description': 'Get instant help through our live chat support system',
    'expertSupport.chat.contact': 'Available 24/7',
    'expertSupport.office.title': 'Visit Our Office',
    'expertSupport.office.location': 'Mumbai, Maharashtra',
    'expertSupport.office.district': 'Business District, India',
    'expertSupport.office.open': 'Open Today',
    'expertSupport.office.cta': 'Get Directions',
    'expertSupport.bottomText': 'Need immediate assistance? Our support team is always ready to help you succeed.',
    'cta.title': 'Ready to Transform Your GST Filing?',
    'cta.subtitle': 'Join 50,000+ businesses who trust us with their GST compliance and save ₹50,000+ annually',
    'cta.feature1': 'Start filing in just 2 minutes',
    'cta.feature2': 'AI-powered accuracy guarantee',
    'cta.feature3': 'Expert support included',
    'cta.trustText': 'Join 25,000+ businesses who trust us with their GST compliance and save ₹50,000+ annually',
    'cta.button': 'Start Your Free Trial',
    'footer.description': 'The most trusted GST compliance platform in India, helping businesses file returns accurately and on time.',
    'footer.product.title': 'Product',
    'footer.product.features': 'Features',
    'footer.product.pricing': 'Pricing',
    'footer.product.integrations': 'Integrations',
    'footer.product.api': 'API Documentation',
    'footer.support.title': 'Support',
    'footer.support.help': 'Help Center',
    'footer.support.documentation': 'Documentation',
    'footer.support.training': 'Training',
    'footer.support.contact': 'Contact Us',
    'footer.company.title': 'Company',
    'footer.company.about': 'About Us',
    'footer.company.careers': 'Careers',
    'footer.company.blog': 'Blog',
    'footer.company.press': 'Press',
    'footer.rights': 'All rights reserved.',
    'footer.legal.privacy': 'Privacy Policy',
    'footer.legal.terms': 'Terms of Service',
    'footer.legal.cookies': 'Cookie Policy',
    'navbar.features': 'Features',
    'navbar.pricing': 'Pricing',
    'navbar.help': 'Help',
    'navbar.login': 'Login',
    'navbar.signup': 'Sign Up',
  },
  hi: {
    'hero.badge': 'अब AI-संचालित GST फाइलिंग के साथ - 50,000+ व्यापारों में शामिल हों',
    'hero.title': 'GST फाइलिंग',
    'hero.subtitle': 'आसान और स्मार्ट बनाई गई',
    'hero.description': 'कृत्रिम बुद्धिमत्ता द्वारा संचालित भारत का सबसे उन्नत GST प्लेटफॉर्म। घंटों नहीं, मिनटों में रिटर्न फाइल करें। 50,000+ सफल व्यापारियों के साथ शामिल हों जो पहले से ही समय और पैसा बचा रहे हैं।',
    'hero.cta.primary': 'मुफ्त ट्रायल शुरू करें',
    'hero.cta.secondary': 'लाइव डेमो देखें',
    'hero.trust.freeTrial': '30 दिन का मुफ्त ट्रायल',
    'hero.trust.security': 'बैंक-ग्रेड सुरक्षा',
    'hero.trust.accuracy': '99.9% सटीकता',
    'hero.trust.customers': '50,000+ खुश ग्राहक',
    'stats.returns': '10 लाख+',
    'stats.customers': '50 हजार+',
    'stats.accuracy': '99.9%',
    'stats.savings': '₹50 हजार+',
    'features.title': 'क्यों 50,000+ व्यापार हमें चुनते हैं',
    'features.subtitle': 'भारतीय व्यापारों के लिए विशेष रूप से बनाए गए हमारे AI-संचालित प्लेटफॉर्म के साथ GST अनुपालन के भविष्य का अनुभव करें',
    'features.aiPowered.title': 'AI-संचालित फाइलिंग',
    'features.aiPowered.description': 'हमारी उन्नत AI स्वचालित रूप से त्रुटियों का पता लगाती है, आपके रिटर्न को अनुकूलित करती है, और नवीनतम GST नियमों के साथ 100% अनुपालन सुनिश्चित करती है।',
    'features.autoCalculation.title': 'स्वचालित कर गणना',
    'features.autoCalculation.description': 'स्मार्ट एल्गोरिदम स्वचालित रूप से आपकी कर देयता की गणना करते हैं, मानवीय त्रुटियों को कम करते हैं और आपके व्यापार के लिए कीमती समय बचाते हैं।',
    'features.compliantReturns.title': 'हमेशा अनुपालित रिटर्न',
    'features.compliantReturns.description': 'वास्तविक समय नियामक परिवर्तनों के साथ अपडेट रहें और नवीनतम सरकारी दिशानिर्देशों के साथ हमेशा अनुपालित रिटर्न फाइल करें।',
    'features.realTimeValidation.title': 'वास्तविक समय सत्यापन',
    'features.realTimeValidation.description': 'GST डेटाबेस के विरुद्ध आपके डेटा का तत्काल सत्यापन त्रुटि-मुक्त फाइलिंग सुनिश्चित करता है और नोटिस की संभावनाओं को कम करता है।',
    'features.smartReminders.title': 'स्मार्ट रिमाइंडर',
    'features.smartReminders.description': 'आपके व्यापार फाइलिंग शेड्यूल के अनुकूल बुद्धिमान रिमाइंडर और सूचनाओं के साथ कभी भी समय सीमा न चूकें।',
    'features.auditTrail.title': 'पूर्ण ऑडिट ट्रेल',
    'features.auditTrail.description': 'पूर्ण पारदर्शिता के लिए हमारे व्यापक ऑडिट ट्रेल सिस्टम के साथ सभी लेनदेन और परिवर्तनों का विस्तृत रिकॉर्ड बनाए रखें।',
    'howItWorks.title': 'यह कैसे काम करता है',
    'howItWorks.subtitle': '3 सरल चरणों में शुरुआत करें और परेशानी मुक्त GST फाइलिंग का अनुभव करें',
    'howItWorks.step1.title': 'अपना डेटा अपलोड करें',
    'howItWorks.step1.description': 'बस अपने बिक्री और खरीदारी डेटा अपलोड करें या स्वचालित डेटा आयात के लिए अपने एकाउंटिंग सॉफ्टवेयर को कनेक्ट करें।',
    'howItWorks.step2.title': 'AI प्रोसेसिंग',
    'howItWorks.step2.description': 'हमारा AI इंजन आपके डेटा को प्रोसेस करता है, जानकारी सत्यापित करता है, और 99.9% सटीकता के साथ आपके GST रिटर्न तैयार करता है।',
    'howItWorks.step3.title': 'फाइल और हो गया',
    'howItWorks.step3.description': 'अपने रिटर्न की समीक्षा करें और सीधे GST पोर्टल पर फाइल करें। स्वीकृति प्राप्त करें और रिकॉर्ड सुरक्षित रूप से स्टोर करें।',
    'testimonials.title': 'हमारे ग्राहक क्या कहते हैं',
    'testimonials.subtitle': 'हजारों संतुष्ट व्यापारों के साथ जुड़ें जिन्होंने अपने GST अनुपालन को बदल दिया है',
    'testimonials.comment1': 'इस प्लेटफॉर्म ने हमारे GST फाइलिंग समय को 5 घंटे से घटाकर केवल 20 मिनट कर दिया। AI-संचालित सुविधाएं अविश्वसनीय हैं और हमारी अनुपालन लागत में हजारों की बचत की है।',
    'testimonials.name1': 'राजेश कुमार',
    'testimonials.business1': 'CEO, कुमार इंडस्ट्रीज',
    'testimonials.comment2': 'स्वचालित त्रुटि पहचान ने उन गलतियों को पकड़ा जिनसे हमें जुर्माना शुल्क देना पड़ता। हमारी एकाउंटिंग प्रक्रिया के लिए यह सबसे अच्छा निवेश था।',
    'testimonials.name2': 'प्रिया शर्मा',
    'testimonials.business2': 'वित्त प्रमुख, शर्मा टेक्सटाइल्स',
    'testimonials.comment3': 'ग्राहक सहायता उत्कृष्ट है और प्लेटफॉर्म अविश्वसनीय रूप से उपयोगकर्ता-मित्र है। हमारी पूरी टीम ने दिनों के भीतर इसे अपना लिया।',
    'testimonials.name3': 'अमित पटेल',
    'testimonials.business3': 'मालिक, पटेल ट्रेडिंग कं.',
    'supportedReturns.title': 'सभी GST रिटर्न समर्थित',
    'supportedReturns.subtitle': 'सभी रिटर्न प्रकारों के समर्थन के साथ पूर्ण GST अनुपालन समाधान',
    'expertSupport.title': 'विशेषज्ञ सहायता प्राप्त करें',
    'expertSupport.subtitle': 'हमारे GST विशेषज्ञ आपकी सफलता में मदद के लिए यहां हैं। कभी भी, कहीं भी हमसे जुड़ें।',
    'expertSupport.phone.title': 'फोन सहायता',
    'expertSupport.phone.description': 'तत्काल सहायता के लिए हमारे GST विशेषज्ञों से सीधे बात करें',
    'expertSupport.phone.contact': '+91 1800-123-4567',
    'expertSupport.phone.number': '+91 1800-123-4567',
    'expertSupport.phone.hours': 'सोम-शनि, 9 AM - 7 PM',
    'expertSupport.phone.available': 'अभी उपलब्ध',
    'expertSupport.phone.emergency': '24/7',
    'expertSupport.phone.cta': 'अभी कॉल करें',
    'expertSupport.email.title': 'ईमेल सहायता',
    'expertSupport.email.description': 'डॉक्यूमेंटेशन और गाइड के साथ ईमेल के माध्यम से विस्तृत सहायता प्राप्त करें',
    'expertSupport.email.contact': 'support@smartgst.com',
    'expertSupport.email.address': 'support@gstfiling.com',
    'expertSupport.email.guarantee': '24/7 प्रतिक्रिया गारंटी',
    'expertSupport.email.online': 'हमेशा ऑनलाइन',
    'expertSupport.email.cta': 'ईमेल भेजें',
    'expertSupport.chat.title': 'लाइव चैट',
    'expertSupport.chat.description': 'हमारे लाइव चैट सपोर्ट सिस्टम के माध्यम से तत्काल सहायता प्राप्त करें',
    'expertSupport.chat.contact': '24/7 उपलब्ध',
    'expertSupport.office.title': 'हमारे ऑफिस आएं',
    'expertSupport.office.location': 'मुंबई, महाराष्ट्र',
    'expertSupport.office.district': 'बिजनेस डिस्ट्रिक्ट, भारत',
    'expertSupport.office.open': 'आज खुला है',
    'expertSupport.office.cta': 'दिशा-निर्देश प्राप्त करें',
    'expertSupport.bottomText': 'तत्काल सहायता चाहिए? हमारी सहायता टीम आपकी सफलता में मदद के लिए हमेशा तैयार है।',
    'cta.title': 'अपनी GST फाइलिंग को बदलने के लिए तैयार हैं?',
    'cta.subtitle': '50,000+ व्यापारों के साथ जुड़ें जो हमारे GST अनुपालन पर भरोसा करते हैं और सालाना ₹50,000+ बचाते हैं',
    'cta.feature1': 'केवल 2 मिनट में फाइलिंग शुरू करें',
    'cta.feature2': 'AI-संचालित सटीकता गारंटी',
    'cta.feature3': 'विशेषज्ञ सहायता शामिल',
    'cta.trustText': '25,000+ व्यापारों के साथ जुड़ें जो हमारे GST अनुपालन पर भरोसा करते हैं और सालाना ₹50,000+ बचाते हैं',
    'cta.button': 'अपना मुफ्त ट्रायल शुरू करें',
    'footer.description': 'भारत में सबसे भरोसेमंद GST अनुपालन प्लेटफॉर्म, जो व्यवसायों को सटीक और समय पर रिटर्न फाइल करने में मदद करता है।',
    'footer.product.title': 'उत्पाद',
    'footer.product.features': 'सुविधाएं',
    'footer.product.pricing': 'मूल्य निर्धारण',
    'footer.product.integrations': 'एकीकरण',
    'footer.product.api': 'API डॉक्यूमेंटेशन',
    'footer.support.title': 'सहायता',
    'footer.support.help': 'सहायता केंद्र',
    'footer.support.documentation': 'डॉक्यूमेंटेशन',
    'footer.support.training': 'प्रशिक्षण',
    'footer.support.contact': 'संपर्क करें',
    'footer.company.title': 'कंपनी',
    'footer.company.about': 'हमारे बारे में',
    'footer.company.careers': 'करियर',
    'footer.company.blog': 'ब्लॉग',
    'footer.company.press': 'प्रेस',
    'footer.rights': 'सभी अधिकार सुरक्षित।',
    'footer.legal.privacy': 'गोपनीयता नीति',
    'footer.legal.terms': 'सेवा की शर्तें',
    'footer.legal.cookies': 'कुकी नीति',
    'navbar.features': 'सुविधाएं',
    'navbar.pricing': 'मूल्य निर्धारण',
    'navbar.help': 'सहायता',
    'navbar.login': 'लॉगिन',
    'navbar.signup': 'साइन अप',
  },
  mr: {
    'hero.badge': 'आता AI-चालित GST फाइलिंगसह - 50,000+ व्यवसायांमध्ये सामील व्हा',
    'hero.title': 'GST फाइलिंग',
    'hero.subtitle': 'सोपी आणि स्मार्ट बनवली',
    'hero.description': 'आर्टिफिशियल इंटेलिजन्सद्वारे चालवलेला भारताचा सर्वात प्रगत GST प्लॅटफॉर्म। तासांत नाही, मिनिटांत रिटर्न फाइल करा। 50,000+ यशस्वी व्यवसायांसोबत सामील व्हा जे आधीच वेळ आणि पैसा वाचवत आहेत.',
    'hero.cta.primary': 'मोफत ट्रायल सुरू करा',
    'hero.cta.secondary': 'लाइव्ह डेमो पहा',
    'hero.trust.freeTrial': '30 दिवसांचा मोफत ट्रायल',
    'hero.trust.security': 'बँक-ग्रेड सिक्युरिटी',
    'hero.trust.accuracy': '99.9% अचूकता',
    'hero.trust.customers': '50,000+ आनंदी ग्राहक',
    'stats.returns': '10 लाख+',
    'stats.customers': '50 हजार+',
    'stats.accuracy': '99.9%',
    'stats.savings': '₹50 हजार+',
    'features.title': 'का 50,000+ व्यवसाय आम्हाला निवडतात',
    'features.subtitle': 'भारतीय व्यवसायांसाठी विशेषत: तयार केलेल्या आमच्या AI-चालित प्लॅटफॉर्मसह GST अनुपालनाच्या भविष्याचा अनुभव घ्या',
    'features.aiPowered.title': 'AI-चालित फाइलिंग',
    'features.aiPowered.description': 'आमचे प्रगत AI आपोआप चुका शोधते, आपले रिटर्न ऑप्टिमाइझ करते आणि नवीनतम GST नियमांसह 100% अनुपालन सुनिश्चित करते.',
    'features.autoCalculation.title': 'ऑटो कर गणना',
    'features.autoCalculation.description': 'स्मार्ट अल्गोरिदम आपोआप आपल्या कर दायित्वाची गणना करतात, मानवी चुका कमी करतात आणि आपल्या व्यवसायासाठी मौल्यवान वेळ वाचवतात.',
    'features.compliantReturns.title': 'नेहमी अनुपालित रिटर्न',
    'features.compliantReturns.description': 'रिअल-टाइम नियामक बदलांसह अपडेट राहा आणि नवीनतम सरकारी मार्गदर्शनासह नेहमी अनुपालित रिटर्न फाइल करा.',
    'features.realTimeValidation.title': 'रिअल-टाइम प्रमाणीकरण',
    'features.realTimeValidation.description': 'GST डेटाबेसच्या विरुद्ध आपल्या डेटाचे तात्काळ प्रमाणीकरण चुकीच्या-मुक्त फाइलिंगची खात्री देते आणि नोटिसेसची शक्यता कमी करते.',
    'features.smartReminders.title': 'स्मार्ट स्मरणपत्रे',
    'features.smartReminders.description': 'आपल्या व्यवसाय फाइलिंग शेड्यूलनुसार बुद्धिमान स्मरणपत्रे आणि सूचनांसह कधीही मुदत चुकवू नका.',
    'features.auditTrail.title': 'संपूर्ण ऑडिट ट्रेल',
    'features.auditTrail.description': 'संपूर्ण पारदर्शकतेसाठी आमच्या व्यापक ऑडिट ट्रेल सिस्टमसह सर्व व्यवहार आणि बदलांचे तपशीलवार रेकॉर्ड ठेवा.',
    'howItWorks.title': 'हे कसे कार्य करते',
    'howItWorks.subtitle': '3 सोप्या पायऱ्यांमध्ये सुरुवात करा आणि अडचण-मुक्त GST फाइलिंगचा अनुभव घ्या',
    'howItWorks.step1.title': 'आपला डेटा अपलोड करा',
    'howItWorks.step1.description': 'फक्त आपला विक्री आणि खरेदीचा डेटा अपलोड करा किंवा आपोआप डेटा आयातीसाठी आपले अकाउंटिंग सॉफ्टवेअर कनेक्ट करा.',
    'howItWorks.step2.title': 'AI प्रक्रिया',
    'howItWorks.step2.description': 'आमचे AI इंजिन आपला डेटा प्रक्रिया करते, माहिती प्रमाणित करते आणि 99.9% अचूकतेसह आपले GST रिटर्न तयार करते.',
    'howItWorks.step3.title': 'फाइल आणि पूर्ण',
    'howItWorks.step3.description': 'आपल्या रिटर्नचे पुनरावलोकन करा आणि थेट GST पोर्टलवर फाइल करा. पावती मिळवा आणि रेकॉर्ड सुरक्षितपणे संग्रहित करा.',
    'testimonials.title': 'आमचे ग्राहक काय म्हणतात',
    'testimonials.subtitle': 'हजारो समाधानी व्यवसायांसोबत सामील व्हा ज्यांनी त्यांचे GST अनुपालन बदलले आहे',
    'testimonials.comment1': 'या प्लॅटफॉर्मने आमचा GST फाइलिंग वेळ 5 तासांवरून फक्त 20 मिनिटांवर कमी केला आहे. AI-चालित वैशिष्ट्ये अविश्वसनीय आहेत आणि त्यांनी आम्हाला अनुपालन खर्चात हजारोंची बचत केली आहे.',
    'testimonials.name1': 'राजेश कुमार',
    'testimonials.business1': 'CEO, कुमार इंडस्ट्रीज',
    'testimonials.comment2': 'आपोआप त्रुटी शोधण्याने अशा चुका पकडल्या ज्यामुळे आम्हाला दंड भरावा लागला असता. आमच्या अकाउंटिंग प्रक्रियेसाठी हा सर्वोत्तम गुंतवणूक होता.',
    'testimonials.name2': 'प्रिया शर्मा',
    'testimonials.business2': 'वित्त प्रमुख, शर्मा टेक्सटाइल्स',
    'testimonials.comment3': 'ग्राहक सेवा उत्कृष्ट आहे आणि प्लॅटफॉर्म आश्चर्यकारकपणे वापरकर्ता-मित्र आहे. आमच्या संपूर्ण टीमने काही दिवसांत ते स्वीकारले.',
    'testimonials.name3': 'अमित पटेल',
    'testimonials.business3': 'मालक, पटेल ट्रेडिंग कं.',
    'supportedReturns.title': 'सर्व GST रिटर्न समर्थित',
    'supportedReturns.subtitle': 'सर्व रिटर्न प्रकारांच्या समर्थनासह संपूर्ण GST अनुपालन समाधान',
    'expertSupport.title': 'तज्ञ सहाय्य मिळवा',
    'expertSupport.subtitle': 'आमचे GST तज्ञ आपल्या यशात मदत करण्यासाठी येथे आहेत. कधीही, कुठेही आमच्याशी संपर्क साधा.',
    'expertSupport.phone.title': 'फोन सहाय्य',
    'expertSupport.phone.description': 'तातडीच्या मदतीसाठी आमच्या GST तज्ञांशी थेट बोला',
    'expertSupport.phone.contact': '+91 1800-123-4567',
    'expertSupport.phone.number': '+91 1800-123-4567',
    'expertSupport.phone.hours': 'सोम-शनि, 9 AM - 7 PM',
    'expertSupport.phone.available': 'आत्ता उपलब्ध',
    'expertSupport.phone.emergency': '24/7',
    'expertSupport.phone.cta': 'आत्ताच कॉल करा',
    'expertSupport.email.title': 'ईमेल सहाय्य',
    'expertSupport.email.description': 'डॉक्युमेंटेशन आणि मार्गदर्शकांसह ईमेलद्वारे तपशीलवार मदत मिळवा',
    'expertSupport.email.contact': 'support@smartgst.com',
    'expertSupport.email.address': 'support@gstfiling.com',
    'expertSupport.email.guarantee': '24/7 प्रतिसाद हमी',
    'expertSupport.email.online': 'नेहमी ऑनलाइन',
    'expertSupport.email.cta': 'ईमेल पाठवा',
    'expertSupport.chat.title': 'लाइव्ह चॅट',
    'expertSupport.chat.description': 'आमच्या लाइव्ह चॅट सपोर्ट सिस्टमद्वारे तत्काळ मदत मिळवा',
    'expertSupport.chat.contact': '24/7 उपलब्ध',
    'expertSupport.office.title': 'आमच्या कार्यालयात या',
    'expertSupport.office.location': 'मुंबई, महाराष्ट्र',
    'expertSupport.office.district': 'बिझनेस डिस्ट्रिक्ट, भारत',
    'expertSupport.office.open': 'आज उघडे आहे',
    'expertSupport.office.cta': 'दिशानिर्देश मिळवा',
    'expertSupport.bottomText': 'तातडीने मदत हवी आहे? आमची सहाय्य टीम आपल्या यशात मदत करण्यासाठी नेहमी तयार आहे.',
    'cta.title': 'आपली GST फाइलिंग बदलण्यास तयार आहात?',
    'cta.subtitle': '50,000+ व्यवसायांसोबत सामील व्हा जे आमच्या GST अनुपालनावर विश्वास ठेवतात आणि वार्षिक ₹50,000+ बचत करतात',
    'cta.feature1': 'फक्त 2 मिनिटांत फाइलिंग सुरू करा',
    'cta.feature2': 'AI-चालित अचूकता हमी',
    'cta.feature3': 'तज्ञ सहाय्य समाविष्ट',
    'cta.trustText': '25,000+ व्यवसायांसोबत सामील व्हा जे आमच्या GST अनुपालनावर विश्वास ठेवतात आणि वार्षिक ₹50,000+ बचत करतात',
    'cta.button': 'आपला मोफत ट्रायल सुरू करा',
    'footer.description': 'भारतातील सर्वात विश्वसनीय GST अनुपालन प्लॅटफॉर्म, व्यवसायांना अचूक आणि वेळेवर रिटर्न फाइल करण्यात मदत करतो.',
    'footer.product.title': 'उत्पादन',
    'footer.product.features': 'वैशिष्ट्ये',
    'footer.product.pricing': 'किंमत निर्धारण',
    'footer.product.integrations': 'एकीकरण',
    'footer.product.api': 'API डॉक्युमेंटेशन',
    'footer.support.title': 'सहाय्य',
    'footer.support.help': 'सहाय्य केंद्र',
    'footer.support.documentation': 'डॉक्युमेंटेशन',
    'footer.support.training': 'प्रशिक्षण',
    'footer.support.contact': 'आमच्याशी संपर्क साधा',
    'footer.company.title': 'कंपनी',
    'footer.company.about': 'आमच्याबद्दल',
    'footer.company.careers': 'करिअर',
    'footer.company.blog': 'ब्लॉग',
    'footer.company.press': 'प्रेस',
    'footer.rights': 'सर्व हक्क राखीव.',
    'footer.legal.privacy': 'गोपनीयता धोरण',
    'footer.legal.terms': 'सेवेच्या अटी',
    'footer.legal.cookies': 'कुकी धोरण',
    'navbar.features': 'वैशिष्ट्ये',
    'navbar.pricing': 'किंमत निर्धारण',
    'navbar.help': 'मदत',
    'navbar.login': 'लॉगिन',
    'navbar.signup': 'साइन अप',
  }
};

// Language context
interface LanguageContextType {
  currentLanguage: typeof languages[0];
  setCurrentLanguage: (language: typeof languages[0]) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Language provider
interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [currentLanguage, setCurrentLanguage] = useState(languages[0]);

  // Load saved language from localStorage (language is global, not user-specific)
  useEffect(() => {
    try {
      const savedLanguage = localStorage.getItem('selectedLanguage');
      if (savedLanguage) {
        const language = languages.find(lang => lang.code === savedLanguage);
        if (language) {
          setCurrentLanguage(language);
        }
      }
    } catch (error) {
      console.error('Error loading language:', error);
    }
  }, []);

  // Save language to localStorage
  const handleLanguageChange = (language: typeof languages[0]) => {
    try {
      setCurrentLanguage(language);
      localStorage.setItem('selectedLanguage', language.code);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  // Translation function
  const t = (key: TranslationKey): string => {
    return translations[currentLanguage.code]?.[key] || translations.en[key] || key;
  };

  const contextValue: LanguageContextType = {
    currentLanguage,
    setCurrentLanguage: handleLanguageChange,
    t,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

// Hook to use language context
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

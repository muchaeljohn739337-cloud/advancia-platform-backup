"use client";
import { Github, Linkedin, Mail, Twitter } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-4">
              Advancia Pay Ledger
            </h3>
            <p className="text-slate-400 mb-4 max-w-md">
              Your trusted platform for secure cryptocurrency trading, digital
              wallet management, and financial innovation.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://twitter.com/advanciapayledger"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-purple-400 transition"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://github.com/advanciapayledger"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-purple-400 transition"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com/company/advanciapayledger"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-purple-400 transition"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="mailto:info@advanciapayledger.com"
                className="text-slate-400 hover:text-purple-400 transition"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-slate-400 hover:text-purple-400 transition"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/features"
                  className="text-slate-400 hover:text-purple-400 transition"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-slate-400 hover:text-purple-400 transition"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-slate-400 hover:text-purple-400 transition"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/terms"
                  className="text-slate-400 hover:text-purple-400 transition"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-slate-400 hover:text-purple-400 transition"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/security"
                  className="text-slate-400 hover:text-purple-400 transition"
                >
                  Security
                </Link>
              </li>
              <li>
                <Link
                  href="/compliance"
                  className="text-slate-400 hover:text-purple-400 transition"
                >
                  Compliance
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-800 pt-8">
          {/* Payment Partners & Legal Info */}
          <div className="mb-4">
            <p className="text-slate-400 text-sm text-center md:text-left mb-2">
              <strong className="text-slate-300">
                Payment Processing Partners:
              </strong>{" "}
              <a
                href="https://stripe.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 underline"
              >
                Stripe Inc.
              </a>{" "}
              (USA) and{" "}
              <a
                href="https://cryptomus.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 underline"
              >
                Cryptomus
              </a>{" "}
              (International).
            </p>
            <p className="text-slate-500 text-xs text-center md:text-left">
              Services provided by{" "}
              <strong className="text-slate-400">
                Advancia Technologies LLC
              </strong>
              , registered in Delaware, USA.
              <br />
              FinCEN MSB Registration: Pending | State Money Transmitter
              Licenses: Applied
            </p>
          </div>

          {/* Copyright & Trust Badges */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">
              © {currentYear} Advancia Pay Ledger. All rights reserved.
            </p>

            {/* Trust Badges */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span>Bank-Level Security</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <span>🔒</span>
                <span>SSL Encrypted</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <span>✓</span>
                <span>PCI DSS Compliant</span>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-slate-500 text-xs text-center max-w-4xl mx-auto">
              <strong className="text-slate-400">Risk Disclosure:</strong>{" "}
              Cryptocurrency trading involves substantial risk of loss. Past
              performance is not indicative of future results. Only invest what
              you can afford to lose. Advancia Pay Ledger is not responsible for
              market volatility or third-party service failures. Users must
              comply with local laws and regulations regarding cryptocurrency
              trading and money transmission.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

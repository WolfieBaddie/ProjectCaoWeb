
import React from 'react';

const FOOTER_LINKS = {
  Product: ['Overview', 'Features', 'Solution', 'Releases'],
  Company: ['About us', 'Careers', 'Press', 'News', 'Media kit', 'Contact'],
  Resources: ['Blog', 'Newsletter', 'Events', 'Help center'],
  Social: ['Twitter', 'LinkedIn', 'Facebook', 'GitHub'],
};

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <h2 className="text-2xl font-bold text-gray-900">NewsHub</h2>
          </div>
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
              <ul className="mt-4 space-y-3">
                {links.map(link => (
                  <li key={link}>
                    <a href="#" className="text-base text-gray-600 hover:text-gray-900">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500">
            <p>&copy; 2023 NewsHub. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 sm:mt-0">
                <a href="#" className="hover:text-gray-800">Terms of Service</a>
                <a href="#" className="hover:text-gray-800">Policy service</a>
                <a href="#" className="hover:text-gray-800">Cookie Policy</a>
                <a href="#" className="hover:text-gray-800">Partners</a>
            </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

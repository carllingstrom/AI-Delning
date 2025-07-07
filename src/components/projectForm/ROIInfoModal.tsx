import React from 'react';

interface ROIInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ROIInfoModal({ isOpen, onClose }: ROIInfoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#121F2B] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#FFD600]">ROI-ramverk förklaring</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="space-y-6 text-white">
          <section>
            <h3 className="text-xl font-semibold text-[#FFD600] mb-3">Ramverk för ROI-beräkning</h3>
            <p className="mb-4">
              För att ta vara på möjligheten att fånga alla effekter från ett AI-projekt används ett kombinerat ramverk som tar hänsyn till både ekonomiska och kvalitativa effekter:
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-[#1a2a3a] p-4 rounded">
                <h4 className="font-semibold text-[#FFD600] mb-2">Ekonomiskt förhållande</h4>
                <p className="text-sm mb-2">ROI = (Total monetär nytta - Total kostnad) / Total kostnad</p>
                <p className="text-xs text-gray-300">Baserat på finansiella effekter och omdistribuerade resurser</p>
              </div>
              
              <div className="bg-[#1a2a3a] p-4 rounded">
                <h4 className="font-semibold text-[#FFD600] mb-2">Kvalitativt förhållande</h4>
                <p className="text-sm mb-2">Kvalitativ ROI = (Målvärde - Nuläge) / Nuläge</p>
                <p className="text-xs text-gray-300">Baserat på kvalitativa mätningar (1-10 skala)</p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-[#FFD600] mb-3">Typer av effekter</h3>
            
            <div className="space-y-4">
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold text-green-400">Finansiell effekt</h4>
                <p className="text-sm mb-2">Direkta ekonomiska besparingar eller intäkter</p>
                <div className="bg-[#1a2a3a] p-3 rounded text-sm">
                  <strong>Exempel:</strong> Besparade 40 timmar per månad × 800 SEK/timme × 12 månader × 3 år = 1,152,000 SEK
                </div>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold text-blue-400">Omdistribuerad resurs</h4>
                <p className="text-sm mb-2">Resurser som frigörs för annat användning</p>
                <div className="bg-[#1a2a3a] p-3 rounded text-sm">
                  <strong>Exempel:</strong> Personalstid: 100 → 60 timmar/månad = 40 timmar frigjorda × 800 SEK × 12 månader × 3 år= 1,152,000 SEK. 
                </div>
              </div>

              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-semibold text-purple-400">Kvalitativ effekt</h4>
                <p className="text-sm mb-2">Förbättringar som mäts på en skala</p>
                <div className="bg-[#1a2a3a] p-3 rounded text-sm">
                  <strong>Exempel:</strong> Servicekvalitet: 6 → 8 (33% förbättring). Uppskattat värde: 500,000 SEK. 
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-[#FFD600] mb-3">Beräkningsexempel</h3>
            
            <div className="bg-[#1a2a3a] p-4 rounded">
              <h4 className="font-semibold mb-3">Projekt: Digitalisering av ansökningsprocess</h4>
              
              <div className="space-y-3 text-sm">
                <div>
                  <strong>Kostnader:</strong> 500,000 SEK
                </div>
                
                <div>
                  <strong>Effekter:</strong>
                  <ul className="ml-4 mt-1 space-y-1">
                    <li>• Finansiell: 1,152,000 SEK (besparade timmar)</li>
                    <li>• Kvalitativ: 500,000 SEK (servicekvalitet)</li>
                  </ul>
                </div>
                
                <div>
                  <strong>Ekonomiskt ROI:</strong> (1,152,000 - 500,000) / 500,000 = 130%
                </div>
                
                <div>
                  <strong>Kvalitativ ROI:</strong> (8 - 6) / 6 = 33%
                </div>
                
                <div className="mt-3 p-2 bg-[#2a3a4a] rounded">
                  <strong>Total nytta:</strong> 1,652,000 SEK<br/>
                  <strong>Kombinerat ROI:</strong> 130% ekonomiskt + 33% kvalitativt
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-[#FFD600] mb-3">Viktiga punkter</h3>
            <ul className="space-y-2 text-sm">
              <li>• <strong>Annualisering:</strong> Användare anger själv hur länge effekten håller i sig</li>
              <li>• <strong>Monetära uppskattningar:</strong> Valfria för kvalitativa effekter men hjälper till ROI-beräkning</li>
              <li>• <strong>Kombinerat värde:</strong> Både ekonomiska och kvalitativa effekter räknas med</li>
              <li>• <strong>Transparens:</strong> Alla beräkningar visas tydligt i ROI-sammanfattningen</li>
            </ul>
          </section>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#FFD600] text-black font-semibold rounded hover:bg-yellow-400 transition-colors"
          >
            Stäng
          </button>
        </div>
      </div>
    </div>
  );
} 
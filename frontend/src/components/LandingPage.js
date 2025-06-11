import React from 'react';
import { useTranslation } from 'react-i18next';

const LandingPage = ({ onGetStarted, onGoToFurnitureBlueprint }) => {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen">
      {/* Hero Section with improved background */}
      <div className="relative bg-gradient-to-br from-gray-50 via-white to-blue-50 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 bg-grid-gray-100 opacity-25"></div>
        <div className="absolute top-10 right-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        
        <div className="relative container mx-auto px-4 py-8">
          {/* Enhanced Navigation */}
          <nav className="flex justify-between items-center mb-20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-soft">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <div className="text-2xl font-bold text-gradient">RenovaAI</div>
            </div>
            
            {/* Navigation Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">{t('common.features')}</a>
              <a href="#comparison" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">{t('common.compare')}</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">{t('common.pricing')}</a>
            </div>
            
            <div className="flex items-center space-x-3">
              <button 
                onClick={onGetStarted}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2.5 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all font-semibold shadow-soft hover-lift"
              >
                {t('common.start')} {t('common.free')}
              </button>
              {onGoToFurnitureBlueprint && (
                <button 
                  onClick={onGoToFurnitureBlueprint}
                  className="btn-secondary hover-lift"
                >
                  🔧 {t('common.blueprints')}
                </button>
              )}
            </div>
          </nav>

          {/* Enhanced Hero Content */}
          <div className="text-center max-w-6xl mx-auto py-20">
            {/* Trust Badge */}
            <div className="mb-8">
              <div className="inline-flex items-center bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-full px-8 py-4 shadow-soft">
                <div className="flex items-center space-x-4">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full border-2 border-white"></div>
                    <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full border-2 border-white"></div>
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full border-2 border-white"></div>
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full border-2 border-white"></div>
                  </div>
                  <span className="text-emerald-700 font-semibold text-sm">
                    ⭐ {t('landing.hero.trustBadge')}
                  </span>
                </div>
              </div>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-bold mb-8 leading-tight text-gray-900">
              {t('landing.hero.transformSpace')}
              <br />
              <span className="text-gradient relative">
                {t('landing.hero.interiorDesign')}
                <div className="absolute -bottom-4 left-0 right-0 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-30"></div>
              </span>
            </h1>
            
            <p className="text-2xl md:text-3xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed font-light">
              {t('landing.hero.description')}
            </p>

            {/* Enhanced CTA Section */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <button 
                onClick={onGetStarted}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12 py-5 rounded-2xl font-bold text-xl hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all shadow-2xl hover-lift relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="relative">{t('landing.hero.startDesigning')}</span>
              </button>
              <button className="btn-secondary text-xl px-12 py-5 hover-lift border-2 border-gray-200 hover:border-gray-300">
                <span className="mr-2">▶️</span>
                {t('landing.hero.watchDemo')}
              </button>
            </div>

            {/* Enhanced Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl mx-auto mb-16">
              <div className="text-center group">
                <div className="text-5xl font-bold text-gradient mb-3 group-hover:scale-110 transition-transform">5-6x</div>
                <div className="text-gray-600 font-medium text-lg">{t('landing.stats.faster')}</div>
                <div className="text-gray-500 text-sm mt-1">{t('landing.stats.fasterSub')}</div>
              </div>
              <div className="text-center group">
                <div className="text-5xl font-bold text-gradient mb-3 group-hover:scale-110 transition-transform">95%</div>
                <div className="text-gray-600 font-medium text-lg">{t('landing.stats.structure')}</div>
                <div className="text-gray-500 text-sm mt-1">{t('landing.stats.structureSub')}</div>
              </div>
              <div className="text-center group">
                <div className="text-5xl font-bold text-gradient mb-3 group-hover:scale-110 transition-transform">2500+</div>
                <div className="text-gray-600 font-medium text-lg">{t('landing.stats.transformations')}</div>
                <div className="text-gray-500 text-sm mt-1">{t('landing.stats.transformationsSub')}</div>
              </div>
            </div>

            {/* Social Proof Logos */}
            <div className="border-t border-gray-200 pt-12">
              <p className="text-gray-500 text-sm mb-8 font-medium">{t('landing.hero.trustedBy')}</p>
              <div className="flex justify-center items-center space-x-12 opacity-60">
                <div className="text-2xl font-bold text-gray-400">Interior+</div>
                <div className="text-2xl font-bold text-gray-400">DesignPro</div>
                <div className="text-2xl font-bold text-gray-400">HomeSpace</div>
                <div className="text-2xl font-bold text-gray-400">StyleAI</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Before/After Showcase */}
      <div className="py-32 bg-white" id="features">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <div className="inline-block bg-blue-100 text-blue-700 px-6 py-2 rounded-full text-sm font-semibold mb-6">
              {t('landing.showcase.badge')}
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-8 text-gray-900">
              {t('landing.showcase.title')}
            </h2>
            <p className="text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {t('landing.showcase.subtitle')}
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-16 max-w-7xl mx-auto items-center">
            {/* Before */}
            <div className="card-modern rounded-3xl p-10 hover-lift relative">
              <div className="absolute -top-4 -left-4 bg-red-500 text-white px-4 py-2 rounded-xl font-bold shadow-lg">
                {t('landing.showcase.before')}
              </div>
              <h3 className="text-3xl font-bold mb-6 text-gray-800">{t('landing.showcase.beforeTitle')}</h3>
              <div className="bg-gradient-to-br from-gray-300 to-gray-400 h-80 rounded-2xl mb-6 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <span className="text-white font-semibold text-xl relative z-10">{t('landing.showcase.oldDesign')}</span>
              </div>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center"><span className="text-red-500 mr-3">❌</span> {t('landing.showcase.outdatedCabinets')}</li>
                <li className="flex items-center"><span className="text-red-500 mr-3">❌</span> {t('landing.showcase.poorLighting')}</li>
                <li className="flex items-center"><span className="text-red-500 mr-3">❌</span> {t('landing.showcase.wastedSpace')}</li>
              </ul>
            </div>
            
            {/* After */}
            <div className="card-modern rounded-3xl p-10 hover-lift relative bg-gradient-to-br from-blue-50 to-emerald-50">
              <div className="absolute -top-4 -right-4 bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold shadow-lg">
                {t('landing.showcase.after')}
              </div>
              <h3 className="text-3xl font-bold mb-6 text-gradient">{t('landing.showcase.afterTitle')}</h3>
              <div className="bg-gradient-to-br from-blue-500 to-emerald-500 h-80 rounded-2xl mb-6 flex items-center justify-center shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                <span className="text-white font-semibold text-xl relative z-10">{t('landing.showcase.newDesign')}</span>
              </div>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center"><span className="text-emerald-500 mr-3">✅</span> {t('landing.showcase.modernAesthetics')}</li>
                <li className="flex items-center"><span className="text-emerald-500 mr-3">✅</span> {t('landing.showcase.optimizedLighting')}</li>
                <li className="flex items-center"><span className="text-emerald-500 mr-3">✅</span> {t('landing.showcase.maximizedSpace')}</li>
              </ul>
            </div>
          </div>

          {/* Process Steps */}
          <div className="mt-24">
            <h3 className="text-4xl font-bold text-center mb-16 text-gray-900">{t('landing.process.title')}</h3>
            <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold shadow-soft">
                  1
                </div>
                <h4 className="text-2xl font-bold mb-4 text-gray-800">{t('landing.process.upload')}</h4>
                <p className="text-gray-600 text-lg">{t('landing.process.uploadDesc')}</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold shadow-soft">
                  2
                </div>
                <h4 className="text-2xl font-bold mb-4 text-gray-800">{t('landing.process.choose')}</h4>
                <p className="text-gray-600 text-lg">{t('landing.process.chooseDesc')}</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold shadow-soft">
                  3
                </div>
                <h4 className="text-2xl font-bold mb-4 text-gray-800">{t('landing.process.results')}</h4>
                <p className="text-gray-600 text-lg">{t('landing.process.resultsDesc')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Features Section */}
      <div className="py-32 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <div className="inline-block bg-purple-100 text-purple-700 px-6 py-2 rounded-full text-sm font-semibold mb-6">
              {t('landing.features.badge')}
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-8 text-gray-900">
              {t('landing.features.title')}
            </h2>
            <p className="text-2xl text-gray-600 max-w-3xl mx-auto">
              {t('landing.features.subtitle')}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 max-w-7xl mx-auto">
            {/* Feature 1 */}
            <div className="text-center lg:text-left">
              <div className="card-modern rounded-3xl p-12 hover-lift h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-8 shadow-soft">
                  <span className="text-3xl">🎨</span>
                </div>
                <h3 className="text-3xl font-bold mb-6 text-gray-800">{t('landing.features.kitchen.title')}</h3>
                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                  {t('landing.features.kitchen.description')}
                </p>
                <div className="flex flex-wrap gap-3 mb-8">
                  <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">{t('landing.features.kitchen.tag1')}</span>
                  <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">{t('landing.features.kitchen.tag2')}</span>
                  <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">{t('landing.features.kitchen.tag3')}</span>
                </div>
                <button 
                  onClick={onGetStarted}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-semibold shadow-soft hover-lift"
                >
                  {t('landing.features.kitchen.button')}
                </button>
              </div>
            </div>
            
            {/* Feature 2 */}
            <div className="text-center lg:text-left">
              <div className="card-modern rounded-3xl p-12 hover-lift h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-8 shadow-soft">
                  <span className="text-3xl">🔧</span>
                </div>
                <h3 className="text-3xl font-bold mb-6 text-gray-800">{t('landing.features.furniture.title')}</h3>
                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                  {t('landing.features.furniture.description')}
                </p>
                <div className="flex flex-wrap gap-3 mb-8">
                  <span className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium">{t('landing.features.furniture.tag1')}</span>
                  <span className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium">{t('landing.features.furniture.tag2')}</span>
                  <span className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium">{t('landing.features.furniture.tag3')}</span>
                </div>
                {onGoToFurnitureBlueprint && (
                  <button 
                    onClick={onGoToFurnitureBlueprint}
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-8 py-4 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all font-semibold shadow-soft hover-lift"
                  >
                    {t('landing.features.furniture.button')}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Additional Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto mt-16">
            <div className="text-center p-8 card-modern rounded-2xl hover-lift">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-soft">
                <span className="text-2xl">🏠</span>
              </div>
              <h4 className="text-xl font-bold mb-3 text-gray-800">{t('landing.features.rooms.title')}</h4>
              <p className="text-gray-600">{t('landing.features.rooms.description')}</p>
            </div>
            
            <div className="text-center p-8 card-modern rounded-2xl hover-lift">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-soft">
                <span className="text-2xl">⚡</span>
              </div>
              <h4 className="text-xl font-bold mb-3 text-gray-800">{t('landing.features.instant.title')}</h4>
              <p className="text-gray-600">{t('landing.features.instant.description')}</p>
            </div>

            <div className="text-center p-8 card-modern rounded-2xl hover-lift">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-soft">
                <span className="text-2xl">🎯</span>
              </div>
              <h4 className="text-xl font-bold mb-3 text-gray-800">{t('landing.features.precision.title')}</h4>
              <p className="text-gray-600">{t('landing.features.precision.description')}</p>
            </div>

            <div className="text-center p-8 card-modern rounded-2xl hover-lift">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-soft">
                <span className="text-2xl">📱</span>
              </div>
              <h4 className="text-xl font-bold mb-3 text-gray-800">{t('landing.features.easy.title')}</h4>
              <p className="text-gray-600">{t('landing.features.easy.description')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Revolutionary Solution Section - FIXED text contrast and language support */}
      <div className="py-32 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-20">
            <div className="inline-flex items-center bg-red-500/20 border border-red-500/30 rounded-full px-8 py-4 mb-8">
              <span className="text-red-400 font-semibold">⚠️ {t('landing.noMore.badge')}</span>
            </div>
            
            <h2 className="text-5xl md:text-7xl font-bold mb-8 text-white leading-tight">
              {t('landing.noMore.title')}
            </h2>
            
            <p className="text-2xl text-gray-300 mb-16 max-w-4xl mx-auto leading-relaxed">
              {t('landing.noMore.subtitle')}
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-10 max-w-7xl mx-auto">
            <div className="card-modern rounded-2xl p-10 text-center hover-lift bg-white/10 backdrop-blur-sm border border-white/20">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-soft">
                <span className="text-3xl">✅</span>
              </div>
              <h4 className="font-bold text-2xl mb-6 text-white">{t('landing.noMore.prompting.title')}</h4>
              <p className="text-gray-100 leading-relaxed text-lg">
                {t('landing.noMore.prompting.description')}
              </p>
            </div>
            
            <div className="card-modern rounded-2xl p-10 text-center hover-lift bg-white/10 backdrop-blur-sm border border-white/20">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-soft">
                <span className="text-3xl">⚡</span>
              </div>
              <h4 className="font-bold text-2xl mb-6 text-white">{t('landing.noMore.generic.title')}</h4>
              <p className="text-gray-100 leading-relaxed text-lg">
                {t('landing.noMore.generic.description')}
              </p>
            </div>
            
            <div className="card-modern rounded-2xl p-10 text-center hover-lift bg-white/10 backdrop-blur-sm border border-white/20">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-soft">
                <span className="text-3xl">🎯</span>
              </div>
              <h4 className="font-bold text-2xl mb-6 text-white">{t('landing.noMore.expertise.title')}</h4>
              <p className="text-gray-100 leading-relaxed text-lg">
                {t('landing.noMore.expertise.description')}
              </p>
            </div>
          </div>
          
          {/* Enhanced Call to Action */}
          <div className="text-center mt-20">
            <button 
              onClick={onGetStarted}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-16 py-6 rounded-2xl font-bold text-2xl hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all shadow-2xl hover-lift relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="relative">{t('landing.noMore.cta')}</span>
            </button>
            <p className="text-gray-300 text-lg mt-6">
              {t('landing.noMore.disclaimer')}
            </p>
          </div>
        </div>
      </div>

      {/* Enhanced Comparison Table */}
      <div className="py-32 bg-gradient-to-br from-gray-50 to-blue-50" id="comparison">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <div className="inline-block bg-emerald-100 text-emerald-700 px-6 py-2 rounded-full text-sm font-semibold mb-6">
                {t('landing.comparison.badge')}
              </div>
              <h2 className="text-5xl md:text-6xl font-bold mb-8 text-gray-900">
                {t('landing.comparison.title')}
              </h2>
              <p className="text-2xl text-gray-600 max-w-3xl mx-auto">
                {t('landing.comparison.subtitle')}
              </p>
            </div>
            
            <div className="card-modern rounded-3xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <tr>
                      <th className="p-8 text-left font-bold text-xl">{t('landing.comparison.factor')}</th>
                      <th className="p-8 text-center font-bold text-xl">
                        <div className="flex items-center justify-center space-x-3">
                          <span>🚀</span>
                          <span>RenovaAI</span>
                        </div>
                      </th>
                      <th className="p-8 text-center font-bold text-xl">{t('landing.comparison.diy')}</th>
                      <th className="p-8 text-center font-bold text-xl">{t('landing.comparison.hiring')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="p-8 font-semibold text-gray-800 text-xl">{t('landing.comparison.time')}</td>
                      <td className="p-8 text-center">
                        <div className="inline-flex items-center bg-emerald-100 text-emerald-800 px-6 py-3 rounded-full font-bold text-lg">
                          ⚡ {t('landing.comparison.timeValue')}
                        </div>
                      </td>
                      <td className="p-8 text-center text-gray-600 font-medium text-lg">{t('landing.comparison.timeDiy')}</td>
                      <td className="p-8 text-center text-gray-600 font-medium text-lg">{t('landing.comparison.timeHiring')}</td>
                    </tr>
                    <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="p-8 font-semibold text-gray-800 text-xl">{t('landing.comparison.cost')}</td>
                      <td className="p-8 text-center">
                        <div className="inline-flex items-center bg-emerald-100 text-emerald-800 px-6 py-3 rounded-full font-bold text-lg">
                          💰 {t('landing.comparison.costValue')}
                        </div>
                      </td>
                      <td className="p-8 text-center text-gray-600 font-medium text-lg">{t('landing.comparison.costDiy')}</td>
                      <td className="p-8 text-center text-gray-600 font-medium text-lg">{t('landing.comparison.costHiring')}</td>
                    </tr>
                    <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="p-8 font-semibold text-gray-800 text-xl">{t('landing.comparison.quality')}</td>
                      <td className="p-8 text-center">
                        <div className="inline-flex items-center bg-emerald-100 text-emerald-800 px-6 py-3 rounded-full font-bold text-lg">
                          ✨ {t('landing.comparison.qualityValue')}
                        </div>
                      </td>
                      <td className="p-8 text-center text-gray-600 font-medium text-lg">{t('landing.comparison.qualityDiy')}</td>
                      <td className="p-8 text-center">
                        <div className="inline-flex items-center bg-blue-100 text-blue-800 px-6 py-3 rounded-full font-bold text-lg">
                          ⭐ {t('landing.comparison.qualityHiring')}
                        </div>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="p-8 font-semibold text-gray-800 text-xl">{t('landing.comparison.revisions')}</td>
                      <td className="p-8 text-center">
                        <div className="inline-flex items-center bg-emerald-100 text-emerald-800 px-6 py-3 rounded-full font-bold text-lg">
                          🔄 {t('landing.comparison.revisionsValue')}
                        </div>
                      </td>
                      <td className="p-8 text-center text-gray-600 font-medium text-lg">{t('landing.comparison.revisionsDiy')}</td>
                      <td className="p-8 text-center text-gray-600 font-medium text-lg">{t('landing.comparison.revisionsHiring')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced CTA Section */}
      <div className="py-32 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden" id="pricing">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 text-center relative">
          <h2 className="text-5xl md:text-7xl font-bold mb-8 text-white leading-tight">
            {t('landing.cta.title')}
          </h2>
          <p className="text-2xl md:text-3xl mb-12 text-white/90 max-w-4xl mx-auto leading-relaxed">
            {t('landing.cta.subtitle')}
          </p>
          
          <div className="flex flex-col lg:flex-row gap-8 justify-center items-center mb-12">
            <button 
              onClick={onGetStarted}
              className="bg-white text-purple-600 px-16 py-6 rounded-2xl font-bold text-2xl hover:bg-gray-100 transition-all transform hover:scale-105 shadow-2xl"
            >
              {t('landing.cta.primary')}
            </button>
            <button className="border-2 border-white/50 text-white px-16 py-6 rounded-2xl font-semibold text-2xl hover:bg-white/10 transition-all">
              {t('landing.cta.secondary')}
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-12 text-white/80">
            <div className="flex items-center space-x-2">
              <span className="text-emerald-400">✓</span>
              <span className="text-lg">{t('landing.cta.feature1')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-emerald-400">✓</span>
              <span className="text-lg">{t('landing.cta.feature2')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-emerald-400">✓</span>
              <span className="text-lg">{t('landing.cta.feature3')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Footer */}
      <footer className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-8 md:mb-0">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-soft">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <div className="text-2xl font-bold text-gradient">RenovaAI</div>
            </div>
            
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8">
              <p className="text-gray-400">{t('landing.footer.copyright')}</p>
              <div className="flex space-x-6 text-gray-400">
                <a href="#" className="hover:text-white transition-colors">{t('landing.footer.privacy')}</a>
                <a href="#" className="hover:text-white transition-colors">{t('landing.footer.terms')}</a>
                <a href="#" className="hover:text-white transition-colors">{t('landing.footer.support')}</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 
import React from 'react'
import { useI18n } from '../../../shared/context/I18nContext'
import './TeamFooter.css'

const TEAM_MEMBERS = [
  'Amen Allāh Hajji',
  'Laabidi Idris',
  'Rihem Amri',
  'Tasnime Ben Boubaker',
  'Yassine Drira',
  'Youssef Fathallah',
  'Nada Ben Taher',
  'Nour Hasnaoui',
  'Omar Abdelkader',
  'Oussema Guerriche',
  'Rayen Mestiri',
]

export function TeamFooter() {
  const { t } = useI18n()
  const containerRef = React.useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    containerRef.current.style.setProperty('--mouse-x', `${x}px`)
    containerRef.current.style.setProperty('--mouse-y', `${y}px`)
  }

  return (
    <div className="team-footer-container">
      {/* The full sliding content */}
      <div 
        className="team-footer-content group/footer"
        ref={containerRef}
        onMouseMove={handleMouseMove}
      >
        {/* Advanced Background Effects */}
        <div className="team-footer-grid-bg" />
        <div className="team-footer-spotlight" />
        
        {/* Top Section: Class & Professor */}
        <div className="team-header">
          <div className="team-meta-item">
            <div className="team-section-title">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
              {t('team.class')}
            </div>
            <div className="team-meta-value">IGL3 – Promotion 2026</div>
          </div>
          <div className="team-meta-divider">
            <div className="team-divider-pulse"></div>
          </div>
          <div className="team-meta-item">
            <div className="team-section-title">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {t('team.professor')}
            </div>
            <div className="team-meta-value">Madame Yosr Slama</div>
          </div>
        </div>

        {/* Bottom Section: Infinite Marquee of Team Members */}
        <div className="team-marquee-container">
          <div className="team-section-title" style={{ marginBottom: '1rem' }}>{t('team.members')}</div>
          <div className="team-marquee-wrapper">
            <div className="team-marquee-track">
              {/* First Track */}
              <div className="team-marquee-inner">
                {TEAM_MEMBERS.map((member, idx) => (
                  <div key={`track1-${member}`} className="team-member group/member">
                    {member}
                  </div>
                ))}
              </div>
              {/* Duplicate Track for seamless loop */}
              <div className="team-marquee-inner">
                {TEAM_MEMBERS.map((member, idx) => (
                  <div key={`track2-${member}`} className="team-member group/member">
                    {member}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

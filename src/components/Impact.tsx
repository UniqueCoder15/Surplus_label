import React, { useState } from 'react';
import { Scale, Utensils, CloudFog, ShieldCheck, Calculator } from 'lucide-react';

export const Impact: React.FC = () => {
  // Interactive Calculator State
  const [weeklySurplusKg, setWeeklySurplusKg] = useState<number>(120);

  // Estimates based on standard environmental benchmarks:
  // ~0.42 kg per standard meal portion
  const estimatedMeals = Math.round((weeklySurplusKg * 52) / 0.42);
  // ~2.5 kg CO2e averted per 1 kg packaged food diverted from landfill
  const estimatedCo2Tons = (((weeklySurplusKg * 52) * 2.5) / 1000).toFixed(1);

  const demoMetrics = [
    {
      label: 'Diverted from Landfill',
      value: '1,420 kg',
      sub: 'Rescued across campus dining trials',
      icon: Scale,
    },
    {
      label: 'Equivalent Meals Shared',
      value: '3,380',
      sub: 'Nutritious portions distributed to pantries',
      icon: Utensils,
    },
    {
      label: 'Avoided Carbon Footprint',
      value: '3.5 tons',
      sub: 'Equivalent greenhouse gas averted (CO₂e)',
      icon: CloudFog,
    },
    {
      label: 'Human-Verified Safety Rate',
      value: '100%',
      sub: 'Zero expired batches dispatched',
      icon: ShieldCheck,
    },
  ];

  return (
    <section id="impact" className="sl-section sl-impact" aria-labelledby="impact-heading">
      <div className="sl-container">
        <div className="sl-section-header">
          <div className="sl-section-header__badge-row">
            <span className="sl-section-header__tag">Measurable Accountability</span>
            <span className="sl-badge sl-badge--secondary sl-badge--xs">Illustrative Benchmark Metrics</span>
          </div>
          <h2 id="impact-heading" className="sl-section-header__title">
            Quantifying Food Dignity &amp; Ecological Impact
          </h2>
          <p className="sl-section-header__lead">
            Every verified handover generates tamper-evident operational data.
            SurplusLabel equips universities and retail partners with audit-grade reporting for ESG and sustainability goals.
          </p>
        </div>

        {/* Demo Telemetry Cards */}
        <div className="sl-impact-grid">
          {demoMetrics.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="sl-impact-card">
                <div className="sl-impact-card__icon-wrap">
                  <Icon size={22} className="sl-text-primary" aria-hidden="true" />
                </div>
                <div className="sl-impact-card__val tabular-nums">{item.value}</div>
                <div className="sl-impact-card__label">{item.label}</div>
                <div className="sl-impact-card__sub">{item.sub}</div>
                <span className="sl-impact-card__tag">*Exhibition Demo Data</span>
              </div>
            );
          })}
        </div>

        {/* Interactive Impact Calculator */}
        <div className="sl-calculator-card">
          <div className="sl-calculator-card__header">
            <div className="sl-calculator-card__icon-box">
              <Calculator size={20} className="sl-text-primary" aria-hidden="true" />
            </div>
            <div>
              <h3 className="sl-calculator-card__title">Interactive Impact Simulator</h3>
              <p className="sl-calculator-card__subtitle">
                Estimate the annual community impact of redistributing surplus from your mess, hostel, or store.
              </p>
            </div>
          </div>

          <div className="sl-calculator-card__body">
            {/* Slider Control */}
            <div className="sl-calculator-control">
              <div className="sl-calculator-control__labels">
                <label htmlFor="surplus-slider" className="sl-label">
                  Estimated Weekly Packaged Food Surplus:
                </label>
                <span className="sl-calculator-control__current tabular-nums">
                  <strong>{weeklySurplusKg} kg</strong> / week
                </span>
              </div>
              <input
                id="surplus-slider"
                type="range"
                min="10"
                max="500"
                step="10"
                value={weeklySurplusKg}
                onChange={(e) => setWeeklySurplusKg(Number(e.target.value))}
                className="sl-slider"
                aria-valuemin={10}
                aria-valuemax={500}
                aria-valuenow={weeklySurplusKg}
                aria-label="Estimated Weekly Packaged Food Surplus in kilograms"
              />
              <div className="sl-slider-ticks" aria-hidden="true">
                <span>10 kg (Small Cafe)</span>
                <span>250 kg (Hostel Mess)</span>
                <span>500 kg (Large Dining Hall)</span>
              </div>
            </div>

            {/* Simulated Annual Output */}
            <div className="sl-calculator-results">
              <div className="sl-calculator-result-item">
                <span className="sl-calculator-result-item__label">Annual Meals Provided</span>
                <span className="sl-calculator-result-item__val tabular-nums">
                  ~{estimatedMeals.toLocaleString()} meals
                </span>
                <span className="sl-calculator-result-item__note">Based on 0.42 kg standard meal portion</span>
              </div>

              <div className="sl-calculator-result-item">
                <span className="sl-calculator-result-item__label">Avoided Landfill Emissions</span>
                <span className="sl-calculator-result-item__val tabular-nums">
                  ~{estimatedCo2Tons} tonnes CO₂e
                </span>
                <span className="sl-calculator-result-item__note">EPA food waste factor (~2.5 kg CO₂e / kg)</span>
              </div>
            </div>
          </div>

          <div className="sl-calculator-card__footer">
            <span className="sl-text-xs sl-text-muted">
              *Calculated using standardized food waste lifecycle factors. SurplusLabel captures verified weight on pickup.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

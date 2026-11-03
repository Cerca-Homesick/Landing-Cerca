import { DISTANCE } from '../content'
import { useCopy } from '../i18n'
import { Postmark } from './Postmark'
import { Stamp } from './Stamp'

type EnvelopeProps = { state: 'open' | 'closed'; stamps?: number }

/** El sobre. `Flight` cambia `data-state` y `data-stamps` directamente mientras viaja. */
export function Envelope({ state, stamps = 0 }: EnvelopeProps) {
  const copy = useCopy()
  const t = copy.envelope
  return (
    <div className="env" data-state={state} data-stamps={stamps}>
      <div className="env__back" />
      <div className="mini-letter">
        <Stamp art="conchas" tone="butter" tilt={-3} />
        <Stamp art="flores" tone="sage" tilt={3} />
        <Stamp art="cafe" tone="blush" tilt={-2} />
      </div>
      <div className="env__front" />
      <div className="env__flap" />
      <span className="env__seal" />
      <div className="env__postmark">
        <Postmark ring={t.postmark} center={DISTANCE} sub="KM" waves />
      </div>
      <div className="env__address">
        <b>{t.to}</b>
        <span>{t.place}</span>
        <span className="demo-tag">{copy.letter.sample}</span>
      </div>
      <div className="env__airmail" />
    </div>
  )
}

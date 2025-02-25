import { useState, useEffect, useMemo } from 'react'
import * as rb from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import { useCurrentWalletInfo } from '../context/WalletContext'
import * as Api from '../libs/JmWalletApi'
import { BitcoinQR } from './BitcoinQR'
import PageTitle from './PageTitle'
import Sprite from './Sprite'
import { CopyButton } from './CopyButton'
import { ShareButton, checkIsWebShareAPISupported } from './ShareButton'
import { SelectableJar, jarFillLevel } from './jars/Jar'
import styles from './Receive.module.css'
import Accordion from './Accordion'

export default function Receive({ wallet }) {
  const { t } = useTranslation()
  const location = useLocation()
  const settings = useSettings()
  const walletInfo = useCurrentWalletInfo()
  const [validated, setValidated] = useState(false)
  const [alert, setAlert] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [address, setAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [selectedJarIndex, setSelectedJarIndex] = useState(parseInt(location.state?.account, 10) || 0)
  const [addressCount, setAddressCount] = useState(0)

  const sortedAccountBalances = useMemo(() => {
    if (!walletInfo) return []
    return Object.values(walletInfo.balanceSummary.accountBalances).sort(
      (lhs, rhs) => lhs.accountIndex - rhs.accountIndex
    )
  }, [walletInfo])

  useEffect(() => {
    const abortCtrl = new AbortController()
    const { name: walletName, token } = wallet

    setAlert(null)
    setIsLoading(true)

    Api.getAddressNew({ walletName, mixdepth: selectedJarIndex, token, signal: abortCtrl.signal })
      .then((res) => (res.ok ? res.json() : Api.Helper.throwError(res, t('receive.error_loading_address_failed'))))
      .then((data) => setAddress(data.address))
      .catch((err) => {
        !abortCtrl.signal.aborted && setAlert({ variant: 'danger', message: err.message })
      })
      // show the loader a little longer to avoid flickering
      .then((_) => new Promise((r) => setTimeout(r, 200)))
      .finally(() => !abortCtrl.signal.aborted && setIsLoading(false))

    return () => abortCtrl.abort()
  }, [wallet, selectedJarIndex, addressCount, t])

  const onSubmit = (e) => {
    e.preventDefault()

    const form = e.currentTarget
    const isValid = form.checkValidity()
    setValidated(true)

    if (isValid) {
      setAddressCount(addressCount + 1)
    }
  }

  return (
    <div className={`${styles.receive}`}>
      <PageTitle title={t('receive.title')} subtitle={t('receive.subtitle')} />
      {alert && <rb.Alert variant={alert.variant}>{alert.message}</rb.Alert>}
      <div className="qr-container mb-4">
        <rb.Card className={`${settings.theme === 'light' ? 'pt-2' : 'pt-4'} pb-4`}>
          <div className={styles['qr-container']}>
            {!isLoading && address && <BitcoinQR address={address} sats={amount} />}
            {(isLoading || !address) && (
              <rb.Placeholder as="div" animation="wave" className={styles['receive-placeholder-qr-container']}>
                <rb.Placeholder className={styles['receive-placeholder-qr']} />
              </rb.Placeholder>
            )}
          </div>
          <rb.Card.Body
            className={`${settings.theme === 'light' ? 'pt-0' : 'pt-3'} pb-0 d-flex flex-column align-items-center`}
          >
            {address && (
              <rb.Card.Text className={`${styles['address']} text-center slashed-zeroes`}>{address}</rb.Card.Text>
            )}
            {!address && (
              <rb.Placeholder as="p" animation="wave" className={styles['receive-placeholder-container']}>
                <rb.Placeholder xs={12} sm={10} md={8} className={styles['receive-placeholder']} />
              </rb.Placeholder>
            )}
            <div className="d-flex justify-content-center gap-3 w-75">
              <CopyButton
                className="btn btn-outline-dark flex-1"
                value={address}
                text={t('receive.button_copy_address')}
                successText={t('receive.text_copy_address_confirmed')}
                disabled={!address || isLoading}
              />
              {checkIsWebShareAPISupported() && <ShareButton value={address} className="flex-1" />}
            </div>
          </rb.Card.Body>
        </rb.Card>
      </div>
      <rb.Form onSubmit={onSubmit} validated={validated} noValidate>
        <Accordion title={t('receive.button_settings')}>
          <div className="mb-4">
            {!walletInfo || sortedAccountBalances.length === 0 ? (
              <rb.Placeholder as="div" animation="wave">
                <rb.Placeholder className={styles.jarsPlaceholder} />
              </rb.Placeholder>
            ) : (
              <div className={styles.jarsContainer}>
                {sortedAccountBalances.map((it) => (
                  <SelectableJar
                    key={it.accountIndex}
                    index={it.accountIndex}
                    balance={it.calculatedTotalBalanceInSats}
                    isSelectable={true}
                    isSelected={it.accountIndex === selectedJarIndex}
                    fillLevel={jarFillLevel(
                      it.calculatedTotalBalanceInSats,
                      walletInfo.balanceSummary.calculatedTotalBalanceInSats
                    )}
                    onClick={(jarIndex) => setSelectedJarIndex(jarIndex)}
                  />
                ))}
              </div>
            )}
            <rb.Form.Group controlId="amountSats">
              <rb.Form.Label>{t('receive.label_amount')}</rb.Form.Label>
              <rb.InputGroup>
                <rb.InputGroup.Text id="amountSats-addon1" className={styles.inputGroupText}>
                  <Sprite symbol="sats" width="24" height="24" />
                </rb.InputGroup.Text>
                <rb.Form.Control
                  aria-label={t('receive.label_amount')}
                  className="slashed-zeroes"
                  name="amount"
                  type="number"
                  placeholder="0"
                  value={amount}
                  disabled={isLoading}
                  onChange={(e) => setAmount(e.target.value)}
                  min={0}
                  step={1}
                />
              </rb.InputGroup>
              <rb.Form.Control.Feedback type="invalid">{t('receive.feedback_invalid_amount')}</rb.Form.Control.Feedback>
            </rb.Form.Group>
          </div>
        </Accordion>

        <div className="d-flex justify-content-center">
          <rb.Button
            variant="outline-dark"
            type="submit"
            disabled={isLoading}
            className="d-flex justify-content-center align-items-center"
          >
            {isLoading ? (
              <>
                <rb.Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                {t('receive.text_getting_address')}
              </>
            ) : (
              <>
                <Sprite symbol="refresh" className="me-2" width="24" height="24" />
                {t('receive.button_new_address')}
              </>
            )}
          </rb.Button>
        </div>
      </rb.Form>
    </div>
  )
}

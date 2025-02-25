import { useMemo, useState } from 'react'
import { Link, NavLink, To } from 'react-router-dom'
import * as rb from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import Sprite from './Sprite'
import Balance from './Balance'
import { TabActivityIndicator, JoiningIndicator } from './ActivityIndicators'
import { useSettings } from '../context/SettingsContext'
import { CurrentWallet, useCurrentWallet, useCurrentWalletInfo } from '../context/WalletContext'
import { useServiceInfo, useSessionConnectionError } from '../context/ServiceInfoContext'
import { walletDisplayName } from '../utils'
import { routes } from '../constants/routes'
import { AmountSats } from '../libs/JmWalletApi'

import styles from './Navbar.module.css'

const BalanceLoadingIndicator = () => {
  return (
    <rb.Placeholder as="div" animation="wave">
      <rb.Placeholder className={styles.balancePlaceholder} />
    </rb.Placeholder>
  )
}

interface WalletPreviewProps {
  wallet: CurrentWallet
  totalBalance?: AmountSats
  unit: Unit
  showBalance?: boolean
}

const WalletPreview = ({ wallet, totalBalance, unit, showBalance = false }: WalletPreviewProps) => {
  return (
    <div className="d-flex align-items-center">
      <Sprite symbol="wallet" width="30" height="30" className="text-body" />
      <div className="d-flex flex-column ms-2 fs-6">
        {wallet && <div className="fw-normal">{walletDisplayName(wallet.name)}</div>}
        {totalBalance === undefined ? (
          <BalanceLoadingIndicator />
        ) : (
          <div className="text-body">
            <Balance
              valueString={`${totalBalance}`}
              convertToUnit={unit}
              showBalance={showBalance}
              enableVisibilityToggle={false}
            />
          </div>
        )}
      </div>
    </div>
  )
}

interface CenterNavProps {
  makerRunning: boolean
  schedulerRunning: boolean
  singleCoinJoinRunning: boolean
  onClick?: () => void
}

const CenterNav = ({ makerRunning, schedulerRunning, singleCoinJoinRunning, onClick }: CenterNavProps) => {
  const { t } = useTranslation()

  return (
    <rb.Nav className="justify-content-center align-items-stretch">
      <rb.Nav.Item className="d-flex align-items-stretch">
        <NavLink
          to={routes.receive}
          onClick={onClick}
          className={({ isActive }) =>
            'center-nav-link nav-link d-flex align-items-center justify-content-center' + (isActive ? ' active' : '')
          }
        >
          {t('navbar.tab_receive')}
        </NavLink>
      </rb.Nav.Item>
      <div className="d-none d-md-flex align-items-center center-nav-link-divider">»</div>
      <rb.Nav.Item className="d-flex align-items-stretch">
        <NavLink
          to={routes.send}
          onClick={onClick}
          className={({ isActive }) =>
            'center-nav-link nav-link d-flex align-items-center justify-content-center' + (isActive ? ' active' : '')
          }
        >
          <div className="d-flex align-items-start">
            {t('navbar.tab_send')}
            <TabActivityIndicator isOn={singleCoinJoinRunning} className="ms-1" />
          </div>
        </NavLink>
      </rb.Nav.Item>
      <div className="d-none d-md-flex align-items-center center-nav-link-divider">»</div>
      <rb.Nav.Item className="d-flex align-items-stretch">
        <NavLink
          to={routes.earn}
          onClick={onClick}
          className={({ isActive }) =>
            'center-nav-link nav-link d-flex align-items-center justify-content-center' + (isActive ? ' active' : '')
          }
        >
          <div className="d-flex align-items-start">
            {t('navbar.tab_earn')}
            <TabActivityIndicator isOn={makerRunning} />
          </div>
        </NavLink>
      </rb.Nav.Item>
      <div className="d-none d-md-flex align-items-center center-nav-link-divider">|</div>
      <rb.Nav.Item className="d-flex align-items-stretch">
        <NavLink
          to={routes.jam}
          onClick={onClick}
          className={({ isActive }) =>
            'center-nav-link nav-link d-flex align-items-center justify-content-center' + (isActive ? ' active' : '')
          }
        >
          <div className="d-flex align-items-start">
            {t('navbar.tab_sweep')}
            <TabActivityIndicator isOn={schedulerRunning} />
          </div>
        </NavLink>
      </rb.Nav.Item>
    </rb.Nav>
  )
}

interface TrailingNavProps {
  joiningRoute?: To
  onClick?: () => void
}

const TrailingNav = ({ joiningRoute, onClick }: TrailingNavProps) => {
  const { t } = useTranslation()

  return (
    <rb.Nav className="justify-content-center align-items-stretch">
      {joiningRoute && (
        <rb.Nav.Item className="d-flex align-items-center pe-2">
          <div className="d-flex align-items-center px-0">
            <NavLink to={joiningRoute} onClick={onClick} className="nav-link">
              <rb.Navbar.Text className="d-md-none">{t('navbar.joining_in_progress')}</rb.Navbar.Text>
              <JoiningIndicator
                isOn={true}
                className="navbar-text text-success"
                title={t('navbar.joining_in_progress')}
              />
            </NavLink>
          </div>
        </rb.Nav.Item>
      )}
      <rb.Nav.Item className="d-flex align-items-stretch">
        <NavLink
          to={routes.settings}
          onClick={onClick}
          className={({ isActive }) =>
            'nav-link d-flex align-items-center justify-content-center px-0' + (isActive ? ' active' : '')
          }
        >
          <Sprite symbol="gear" width="30" height="30" className="d-none d-md-inline-block" />
          <span className="d-inline-block d-md-none">{t('navbar.menu_mobile_settings')}</span>
        </NavLink>
      </rb.Nav.Item>
    </rb.Nav>
  )
}

export default function Navbar() {
  const { t } = useTranslation()
  const settings = useSettings()
  const currentWallet = useCurrentWallet()
  const currentWalletInfo = useCurrentWalletInfo()

  const serviceInfo = useServiceInfo()
  const sessionConnectionError = useSessionConnectionError()

  const [isExpanded, setIsExpanded] = useState(false)

  const makerRunning = useMemo(() => serviceInfo?.makerRunning || false, [serviceInfo])
  const schedulerRunning = useMemo(
    () => (serviceInfo?.coinjoinInProgress && serviceInfo?.schedule !== null) || false,
    [serviceInfo]
  )
  const singleCoinJoinRunning = useMemo(
    () => (serviceInfo?.coinjoinInProgress && serviceInfo?.schedule === null) || false,
    [serviceInfo]
  )

  const joiningRoute = useMemo(() => {
    if (schedulerRunning) return routes.jam
    if (singleCoinJoinRunning) return routes.send
    if (makerRunning) return routes.earn

    return undefined
  }, [makerRunning, schedulerRunning, singleCoinJoinRunning])

  const height = '75px'

  return (
    <rb.Navbar
      id="mainNav"
      bg={settings.theme === 'light' ? 'white' : 'dark'}
      sticky="top"
      expand="md"
      variant={settings.theme}
      expanded={isExpanded}
      onToggle={(expanded) => setIsExpanded(expanded)}
      className="border-bottom py-0"
    >
      <rb.Container fluid="xl" className="align-items-stretch">
        {sessionConnectionError ? (
          <rb.Navbar.Text className="d-flex align-items-center" style={{ height: height }}>
            No Connection
          </rb.Navbar.Text>
        ) : (
          <>
            {!currentWallet ? (
              <>
                <Link
                  to={routes.home}
                  className="navbar-brand nav-link d-flex align-items-center ps-0 ps-sm-2 ps-xl-0"
                  style={{ height: height }}
                >
                  <Sprite symbol="logo" width="30" height="30" className="d-inline-block align-top" />
                  <span className="ms-2">{t('navbar.title')}</span>
                </Link>
                <div className="d-flex d-md-none align-items-center">
                  <rb.Navbar.Toggle id="mainNavToggle">
                    <span>{t('navbar.menu')}</span>
                  </rb.Navbar.Toggle>
                </div>
                <rb.Navbar.Offcanvas className={`navbar-offcanvas navbar-${settings.theme}`} placement="end">
                  <rb.Offcanvas.Header>
                    <rb.Offcanvas.Title>{t('navbar.title')}</rb.Offcanvas.Title>
                  </rb.Offcanvas.Header>
                  <rb.Offcanvas.Body>
                    <rb.Nav className="ms-auto">
                      <rb.Nav.Item>
                        <Link
                          to={routes.createWallet}
                          onClick={() => isExpanded && setIsExpanded(false)}
                          className="nav-link"
                        >
                          {t('navbar.button_create_wallet')}
                        </Link>
                      </rb.Nav.Item>
                    </rb.Nav>
                  </rb.Offcanvas.Body>
                </rb.Navbar.Offcanvas>
              </>
            ) : (
              <>
                <rb.Nav className="d-flex flex-1 align-items-stretch">
                  <rb.Nav.Item className="d-flex align-items-stretch">
                    <NavLink
                      to={routes.wallet}
                      style={{ height: height }}
                      className={({ isActive }) =>
                        'leading-nav-link nav-link d-flex align-items-center' + (isActive ? ' active' : '')
                      }
                    >
                      <WalletPreview
                        wallet={currentWallet}
                        totalBalance={currentWalletInfo?.balanceSummary.calculatedTotalBalanceInSats}
                        showBalance={settings.showBalance}
                        unit={settings.unit}
                      />
                    </NavLink>
                  </rb.Nav.Item>
                </rb.Nav>
                <div className="d-flex d-md-none align-items-center">
                  <rb.Navbar.Toggle id="mainNavToggle">
                    <span>{t('navbar.menu_mobile')}</span>
                  </rb.Navbar.Toggle>
                </div>
                <rb.Navbar.Offcanvas className={`navbar-offcanvas navbar-${settings.theme}`} placement="end">
                  <rb.Offcanvas.Header>
                    <rb.Offcanvas.Title>{t('navbar.title')}</rb.Offcanvas.Title>
                  </rb.Offcanvas.Header>
                  <rb.Offcanvas.Body>
                    <CenterNav
                      makerRunning={makerRunning}
                      schedulerRunning={schedulerRunning}
                      singleCoinJoinRunning={singleCoinJoinRunning}
                      onClick={() => setIsExpanded(!isExpanded)}
                    />
                    <TrailingNav joiningRoute={joiningRoute} onClick={() => setIsExpanded(!isExpanded)} />
                  </rb.Offcanvas.Body>
                </rb.Navbar.Offcanvas>
                <rb.Container className="d-none d-md-flex flex-1 flex-grow-0 align-items-stretch">
                  <CenterNav
                    makerRunning={makerRunning}
                    schedulerRunning={schedulerRunning}
                    singleCoinJoinRunning={singleCoinJoinRunning}
                  />
                </rb.Container>
                <rb.Container className="d-none d-md-flex flex-1 align-items-stretch">
                  <div className="ms-auto d-flex align-items-stretch">
                    <TrailingNav joiningRoute={joiningRoute} />
                  </div>
                </rb.Container>
              </>
            )}
          </>
        )}
      </rb.Container>
    </rb.Navbar>
  )
}

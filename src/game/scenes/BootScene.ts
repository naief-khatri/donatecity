import Phaser from 'phaser'
import { ASSET_KEYS } from '@/game/config/cityConfig'

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene')
  }

  preload() {
    // Create loading UI
    const { width, height } = this.scale
    const centerX = width / 2
    const centerY = height / 2

    // Background
    this.cameras.main.setBackgroundColor('#1a1a2e')

    // Loading text
    const loadingText = this.add.text(centerX, centerY - 60, 'BUILDING YOUR CITY...', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      color: '#e0e0e0',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    // Progress bar background
    const barBg = this.add.rectangle(centerX, centerY, 400, 30, 0x333355)
    barBg.setStrokeStyle(2, 0x5555aa)

    // Progress bar fill
    const barFill = this.add.rectangle(centerX - 198, centerY, 0, 26, 0x44aa88)
    barFill.setOrigin(0, 0.5)

    // Percentage text
    const percentText = this.add.text(centerX, centerY + 40, '0%', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#888899',
    }).setOrigin(0.5)

    // Update progress bar
    this.load.on('progress', (value: number) => {
      barFill.width = 396 * value
      percentText.setText(`${Math.round(value * 100)}%`)
    })

    this.load.on('complete', () => {
      loadingText.setText('READY!')
      percentText.setText('100%')
    })

    // Load all assets
    for (const asset of Object.values(ASSET_KEYS)) {
      this.load.image(asset.key, asset.path)
    }
  }

  create() {
    // Brief delay then transition to CityScene
    this.time.delayedCall(300, () => {
      this.scene.start('CityScene', this.registry.get('cityState'))
    })
  }
}

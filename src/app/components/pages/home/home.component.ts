import { Component } from '@angular/core';
import { NgClass } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

interface Tool {
  icon: string;
  titleKey: string;
  title: string;
  descKey: string;
  description: string;
  available: boolean;
}

@Component({
  selector: 'app-home',
  imports: [CardModule, ButtonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  tools: Tool[] = [
    {
      icon: 'pi-image',
      titleKey: 'tool_compress_title',
      title: 'Compression d\'image',
      descKey: 'tool_compress_desc',
      description: 'Réduisez la taille de vos images sans perte de qualité visible.',
      available: false
    },
    {
      icon: 'pi-calculator',
      titleKey: 'tool_calc_title',
      title: 'Calculateurs',
      descKey: 'tool_calc_desc',
      description: 'Pourcentages, TVA, conversions et calculs du quotidien.',
      available: false
    },
    {
      icon: 'pi-arrows-h',
      titleKey: 'tool_convert_title',
      title: 'Conversions',
      descKey: 'tool_convert_desc',
      description: 'Convertissez unités, devises et formats en un clic.',
      available: false
    },
    {
      icon: 'pi-palette',
      titleKey: 'tool_color_title',
      title: 'Outils couleur',
      descKey: 'tool_color_desc',
      description: 'Palettes, picker et conversions HEX/RGB/HSL.',
      available: false
    },
    {
      icon: 'pi-file-edit',
      titleKey: 'tool_text_title',
      title: 'Outils texte',
      descKey: 'tool_text_desc',
      description: 'Compteur de mots, formatage et manipulation de texte.',
      available: false
    },
    {
      icon: 'pi-qrcode',
      titleKey: 'tool_qr_title',
      title: 'Générateur QR Code',
      descKey: 'tool_qr_desc',
      description: 'Créez des QR codes personnalisés instantanément.',
      available: false
    }
  ];

  features = [
    {
      icon: 'pi-bolt',
      title: 'Ultra rapide',
      description: 'Traitement instantané, directement dans votre navigateur.'
    },
    {
      icon: 'pi-lock',
      title: '100% privé',
      description: 'Vos fichiers ne quittent jamais votre appareil.'
    },
    {
      icon: 'pi-wallet',
      title: 'Gratuit',
      description: 'Tous les outils sont gratuits, sans limite d\'utilisation.'
    },
    {
      icon: 'pi-user',
      title: 'Sans inscription',
      description: 'Aucun compte requis, utilisez les outils immédiatement.'
    }
  ];

  scrollToTools(): void {
    document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' });
  }
}

import type { ToolEditorialModel } from '../../../../models/tool-editorial/tool-editorial.model';

export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_dev_seo_software_schema_title:Créer un balisage SoftwareApplication utile et vérifiable`,
  lead: $localize`:@@ed_dev_seo_software_schema_lead:Ce générateur transforme les informations réellement publiées sur une application en JSON-LD Schema.org. Il distingue la validité du schéma de l’éligibilité au résultat enrichi Google, contrôle les champs sensibles et produit une balise script sûre sans transmettre les données saisies.` ,
  updatedAtIso: '2026-09-14',
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_dev_seo_software_schema_use_cases:Cas d’utilisation`,
      icon: 'tc-icon tc-icon-bolt',
      items: [
        {
          title: $localize`:@@ed_dev_seo_software_schema_uc1_title:Baliser la page officielle d’une application`,
          text: $localize`:@@ed_dev_seo_software_schema_uc1_text:Décrivez une application web, mobile ou logicielle avec son nom, son URL, sa plateforme, sa catégorie et son offre, puis intégrez le bloc JSON-LD dans la page correspondante.` ,
        },
        {
          title: $localize`:@@ed_dev_seo_software_schema_uc2_title:Contrôler les propriétés exigées par Google`,
          text: $localize`:@@ed_dev_seo_software_schema_uc2_text:L’état de validation sépare les erreurs bloquantes, les recommandations et l’absence de note agrégée réelle nécessaire à l’éligibilité du résultat enrichi.` ,
        },
        {
          title: $localize`:@@ed_dev_seo_software_schema_uc3_title:Livrer un extrait reproductible`,
          text: $localize`:@@ed_dev_seo_software_schema_uc3_text:Copiez la balise script prête à intégrer ou téléchargez le JSON-LD seul afin de le versionner, le relire et le tester dans votre chaîne de publication.` ,
        },
      ],
    },
    {
      id: 'method',
      kind: 'text',
      heading: $localize`:@@ed_dev_seo_software_schema_method:Méthode recommandée`,
      icon: 'tc-icon tc-icon-list',
      paragraphs: [
        $localize`:@@ed_dev_seo_software_schema_method_1:Commencez par la page canonique consacrée à l’application. Reprenez exactement le nom, le prix et les systèmes affichés aux visiteurs ; utilisez un prix égal à zéro pour une application gratuite.` ,
        $localize`:@@ed_dev_seo_software_schema_method_2:Choisissez uniquement une catégorie reconnue par Google. SoftwareApplication convient au cas général ; WebApplication et MobileApplication précisent la nature du produit lorsque cette distinction est réelle.` ,
        $localize`:@@ed_dev_seo_software_schema_method_3:N’activez AggregateRating que si la moyenne, l’échelle et le nombre de notes proviennent de données réelles visibles sur la page. Testez ensuite le HTML publié, pas seulement le fragment généré.` ,
      ],
    },
    {
      id: 'requirements',
      kind: 'list',
      heading: $localize`:@@ed_dev_seo_software_schema_requirements:Propriétés et interprétation`,
      icon: 'tc-icon tc-icon-check-circle',
      items: [
        {
          title: $localize`:@@ed_dev_seo_software_schema_required_title:Requis pour Google`,
          text: $localize`:@@ed_dev_seo_software_schema_required_text:Le nom et offers.price sont obligatoires. Il faut aussi fournir soit une note agrégée, soit un avis conforme ; cet outil prend en charge la voie AggregateRating.` ,
        },
        {
          title: $localize`:@@ed_dev_seo_software_schema_recommended_title:Recommandé`,
          text: $localize`:@@ed_dev_seo_software_schema_recommended_text:applicationCategory et operatingSystem donnent du contexte. Pour une offre payante, priceCurrency évite que le moteur doive deviner la devise.` ,
        },
        {
          title: $localize`:@@ed_dev_seo_software_schema_optional_title:Complément Schema.org`,
          text: $localize`:@@ed_dev_seo_software_schema_optional_text:Description, URL, capture et version enrichissent l’entité Schema.org même si elles ne remplacent aucune propriété obligatoire du résultat Google.` ,
        },
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_dev_seo_software_schema_limits:Limites, sécurité et honnêteté`,
      icon: 'tc-icon tc-icon-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_dev_seo_software_schema_limit_1:Le générateur ne crawle pas la page et ne peut donc pas prouver que les valeurs sont visibles. Cette cohérence doit être contrôlée lors de la revue éditoriale et dans le HTML publié.` ,
        },
        {
          text: $localize`:@@ed_dev_seo_software_schema_limit_2:Les URL sont limitées à HTTP et HTTPS sans identifiants intégrés. Les champs textuels et numériques sont bornés, et les chevrons sont échappés dans la sortie script pour empêcher une fermeture prématurée de la balise.` ,
        },
        {
          text: $localize`:@@ed_dev_seo_software_schema_limit_3:Un état « propriétés présentes » ne garantit ni résultat enrichi, ni indexation, ni classement. Google conserve la décision finale et peut appliquer des règles non détectables localement.` ,
        },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_dev_seo_software_schema_faq:Questions fréquentes`,
      icon: 'tc-icon tc-icon-question-circle',
      items: [
        {
          q: $localize`:@@ed_dev_seo_software_schema_q1:Faut-il mettre une devise pour une application gratuite ?`,
          a: $localize`:@@ed_dev_seo_software_schema_a1:Le prix zéro est la propriété essentielle pour une application gratuite. La devise devient surtout importante lorsque le prix est supérieur à zéro ; l’outil accepte donc une offre gratuite sans devise.` ,
        },
        {
          q: $localize`:@@ed_dev_seo_software_schema_q2:Pourquoi le schéma peut-il être valide mais incomplet pour Google ?`,
          a: $localize`:@@ed_dev_seo_software_schema_a2:Schema.org autorise de nombreuses descriptions partielles. Le résultat enrichi SoftwareApplication ajoute ses propres propriétés obligatoires, notamment une note agrégée ou un avis réel en plus du nom et du prix.` ,
        },
        {
          q: $localize`:@@ed_dev_seo_software_schema_q3:Peut-on utiliser une note provenant d’une autre plateforme ?`,
          a: $localize`:@@ed_dev_seo_software_schema_a3:Ne recopiez pas une note sans vérifier les règles de la plateforme, la représentativité de la valeur et sa présence visible sur la page. Le balisage doit rester fidèle et vérifiable par le visiteur.` ,
        },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_dev_seo_software_schema_tip_title:Valider le document final`,
      icon: 'tc-icon tc-icon-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_dev_seo_software_schema_tip:Après intégration, passez l’URL publique dans le test des résultats enrichis puis utilisez l’inspection d’URL de Search Console. Un fragment correct peut être supprimé, dupliqué ou modifié par le rendu de la page.` ,
    },
  ],
};

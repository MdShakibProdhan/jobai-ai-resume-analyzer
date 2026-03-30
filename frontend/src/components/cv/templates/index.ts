import { ClassicTemplate } from './ClassicTemplate';
import { ModernTemplate } from './ModernTemplate';
import { MinimalTemplate } from './MinimalTemplate';
import { ProfessionalTemplate } from './ProfessionalTemplate';
import { CreativeTemplate } from './CreativeTemplate';
import { ElegantTemplate } from './ElegantTemplate';
import { TemplateProps } from './shared';
import { TemplateId } from '@/types/cv';

export const templateMap: Record<TemplateId, React.FC<TemplateProps>> = {
  classic: ClassicTemplate,
  modern: ModernTemplate,
  minimal: MinimalTemplate,
  professional: ProfessionalTemplate,
  creative: CreativeTemplate,
  elegant: ElegantTemplate,
};

export { ClassicTemplate, ModernTemplate, MinimalTemplate, ProfessionalTemplate, CreativeTemplate, ElegantTemplate };

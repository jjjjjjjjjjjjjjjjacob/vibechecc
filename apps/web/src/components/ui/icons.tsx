/**
 * Optimized Icon System for vibechecc
 *
 * This file imports only the specific icons used throughout the app
 * to significantly reduce bundle size from lucide-react (600KB -> ~50KB)
 *
 * Usage: import { ChevronDown, Plus } from '@/components/ui/icons';
 *
 * IMPORTANT: When adding new icons, only import them from lucide-react
 * if they are actually being used to maintain bundle optimization.
 */

// Core navigation and UI icons (most frequently used)
export {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronUp,
  Plus,
  PlusCircle,
  X,
  Home,
  Search,
  Settings,
  Settings2,
  MoreHorizontal,
  Menu,
  Globe,
} from 'lucide-react';

// Content and interaction icons
export {
  Heart,
  Star,
  MessageCircle,
  MessageSquare,
  Copy,
  Edit,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Flag,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Zap,
  Save,
  PartyPopper,
  Rocket,
  Share,
} from 'lucide-react';

// Status and feedback icons
export {
  Check,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Circle,
  Clock,
  Bell,
} from 'lucide-react';

// User and social icons
export {
  User,
  Users,
  UserPlus,
  UserMinus,
  LogIn,
  LogOut,
  Shield,
  Ban,
} from 'lucide-react';

// Content organization icons
export {
  Filter,
  List,
  LayoutGrid,
  LayoutDashboard,
  Tag,
  Hash,
  Layers,
  SlidersHorizontal,
  Calendar,
  CalendarDays,
  Grid3X3,
  Activity,
} from 'lucide-react';

// Theme and visual icons
export { Sun, Moon, Laptop, Palette, Shuffle } from 'lucide-react';

// Device and info icons
export { Maximize2, Info, Smartphone, Monitor } from 'lucide-react';

// Analytics and trends icons
export { Flame, Download } from 'lucide-react';

// Media icons
export { Camera, Image } from 'lucide-react';

// Panel and layout icons (for admin)
export { PanelLeft } from 'lucide-react';

// Social media icons
export { Twitter, Instagram } from 'lucide-react';

// Emoji and reactions
export { Smile } from 'lucide-react';

// Celebration and special icons
export { Trophy, Crown, Music2, Type } from 'lucide-react';

// Re-export commonly used icon components with better names
export {
  ChevronDown as ChevronDownIcon,
  ChevronUp as ChevronUpIcon,
  Search as SearchIcon,
  Check as CheckIcon,
  X as XIcon,
  Circle as CircleIcon,
  PanelLeft as PanelLeftIcon,
} from 'lucide-react';

// Icon component props type (re-exported from lucide-react for convenience)
export type { LucideProps as IconProps } from 'lucide-react';

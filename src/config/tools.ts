import {
  UserSearch,
  Phone,
  Image,
  Globe,
  Network,
  Mail,
  type LucideIcon,
  ShieldAlert,
  Terminal,
  Layers,
} from "lucide-react";

export interface Tool {
  name: string;
  href: string;
  icon: LucideIcon;
  description: string;
}

export const tools: Tool[] = [
  {
    name: "Username Lookup",
    href: "/tools/username-lookup",
    icon: UserSearch,
    description: "Find social media profiles and online accounts by username.",
  },
  {
    name: "Phone Validator",
    href: "/tools/phone-validator",
    icon: Phone,
    description: "Validate and get information about a phone number.",
  },
  {
    name: "Reverse Image Search",
    href: "/tools/reverse-image-search",
    icon: Image,
    description: "Find the source and similar images across the web.",
  },
  {
    name: "IP Locator",
    href: "/tools/ip-locator",
    icon: Globe,
    description: "Trace an IP address to its geographic location.",
  },
  {
    name: "Domain Lookup",
    href: "/tools/domain-lookup",
    icon: Network,
    description: "Retrieve WHOIS, DNS, and other records for a domain.",
  },
  {
    name: "Email Lookup",
    href: "/tools/email-lookup",
    icon: Mail,
    description: "Gather information associated with an email address.",
  },
  {
    name: "Clickjacking Checker",
    href: "/tools/clickjacking",
    icon: ShieldAlert,
    description: "Verify if a web application is protected against framing-based attacks.",
  },
  {
    name: "Host Header Tester",
    href: "/tools/host-header",
    icon: Terminal,
    description: "Inject custom Host headers to identify vulnerabilities in server configuration.",
  },
  {
    name: "Subdomain Enum",
    href: "/tools/subdomain-enum",
    icon: Layers,
    description: "Search Certificate Transparency logs to discover subdomains for a target domain.",
  },
];

export const SITE = {
  name: 'Enrico Mostacci',
  short: 'enrico',
  handle: 'enrico.mostacci',
  title: 'Enrico Mostacci — Platform engineer',
  description: 'Kubernetes platforms, GitOps pipelines and the Terraform underneath them. Based in Turin.',
  location: 'Turin, IT',
  email: 'enrico.vex@gmail.com',
  github: 'https://github.com/Cheaptrunk',
  linkedin: 'https://www.linkedin.com/in/enrico-mostacci',
  cv: '/cv.pdf', // TODO: drop the PDF into public/
};

export const NAV = [
  { href: '/', label: 'home' },
  { href: '/whoami', label: 'whoami' },
  { href: '/portfolio', label: 'portfolio' },
  { href: '/blog', label: 'blog' },
] as const;

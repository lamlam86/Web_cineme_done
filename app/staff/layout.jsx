import StaffShell from '@/components/staff/StaffShell';

export const metadata = {
  title: "Staff Dashboard - LMK Cinema",
};

export default function StaffLayout({ children }) {
  return <StaffShell>{children}</StaffShell>;
}

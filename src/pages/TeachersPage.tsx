import { motion } from 'motion/react';
import { HeaderComponent } from '../components/HeaderComponent';
import { TeachersComponent } from '../components/TeachersComponent';
import { pageVariants, PAGE_TRANSITION } from '../animations/presets';

export function TeachersPage() {
  return (
    <motion.div
      className="teachers-page-wrapper"
      style={{ flex: 1 }}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={PAGE_TRANSITION}
    >
      <HeaderComponent title={'Преподаватели'} backButton />
      <TeachersComponent />
    </motion.div>
  );
}
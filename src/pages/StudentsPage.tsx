import { motion } from 'motion/react';
import { HeaderComponent } from '../components/HeaderComponent';
import { StudentsComponent } from '../components/StudentsComponent';
import { pageVariants, PAGE_TRANSITION } from '../animations/presets';

export function StudentsPage() {
  return (
    <motion.div
      className="students-page-wrapper"
      style={{ flex: 1 }}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={PAGE_TRANSITION}
    >
      <HeaderComponent title={'Одногруппники'} backButton />
      <StudentsComponent />
    </motion.div>
  );
}
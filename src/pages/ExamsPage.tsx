import { motion } from 'motion/react';
import { HeaderComponent } from '../components/HeaderComponent';
import { ExamsComponent } from '../components/ExamsComponent';
import { pageVariants, PAGE_TRANSITION } from '../animations/presets';

export function ExamsPage() {
  return (
    <motion.div
      className="exams-page-wrapper"
      style={{ flex: 1 }}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={PAGE_TRANSITION}
    >
      <HeaderComponent title={'Экзамены'} backButton />
      <ExamsComponent />
    </motion.div>
  );
}
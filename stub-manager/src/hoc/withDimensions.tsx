import React, {useRef, useState, useEffect} from 'react';

export const withDimensions = <P extends object>(WrapperComponent: React.ComponentType<P>): React.FC<P> => {
  return (props) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const componentRef = useRef<any>(null);
    const [dimension, setDimension] = useState<{width: string; height: string}>({width: '100%', height: '100%'});

    useEffect(() => {
      const observer = new ResizeObserver((...args) => {
        if (componentRef.current) componentRef.current.containerElement.style.display = 'none';
        const newDimension = {
          height: `${containerRef.current?.clientHeight}px`,
          width: `${containerRef.current?.clientWidth}px`,
        };
        if (componentRef.current) componentRef.current.containerElement.style.display = '';
        setDimension(newDimension);
      });
      if (containerRef.current) {
        observer.observe(containerRef.current);
      }
      // containerRef.current;
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      return () => {
        containerRef.current && observer.unobserve(containerRef.current);
      };
    }, []);
    return (
      <>
        {/* <div style={{position: 'absolute', zIndex: 1, background: 'aliceblue'}}>{JSON.stringify(dimension)}</div> */}
        <div style={{width: '100%', height: '100%'}} ref={containerRef}>
          <WrapperComponent ref={componentRef} {...props} {...dimension}></WrapperComponent>
        </div>
      </>
    );
  };
};

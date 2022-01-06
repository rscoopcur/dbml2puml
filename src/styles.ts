export const ErdShapeRoot = 'edgeStyle=entityRelationEdgeStyle;endFill=1;startFill=0;';

export const ErdShapeTable = 'shape=table;startSize=30;container=1;collapsible=1;childLayout=tableLayout;fixedRows=1;rowLines=0;fontStyle=1;align=center;resizeLast=1;';

export const ErdPkRowContainer = 'shape=partialRectangle;collapsible=0;dropTarget=0;pointerEvents=0;fillColor=none;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;top=0;left=0;right=0;bottom=1;';

export const ErdRowContainer = 'shape=partialRectangle;collapsible=0;dropTarget=0;pointerEvents=0;fillColor=none;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;top=0;left=0;right=0;bottom=0;';

export function buildFontStyle(bold = false, underline = false) {
  let fontStyle = 0;

  if (bold) {
    fontStyle += 1;
  }

  if (underline) {
    fontStyle += 4;
  }

  return `shape=partialRectangle;overflow=hidden;connectable=0;fillColor=none;top=0;left=0;bottom=0;right=0;fontStyle=${fontStyle};`
}

export function buildArrowStyle(startArrow: string, endArrow: string) {
  return `edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;exitX=1;exitY=0.5;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;endArrow=${endArrow};endFill=0;startArrow=${startArrow};startFill=0;`
}

